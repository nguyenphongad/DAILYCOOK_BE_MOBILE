require('dotenv').config();
const AccountModel = require('../model/AccountModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabase');
const Account = require('../model/AccountModel');
const axios = require('axios');
const mongoose = require('mongoose');

const loginAdmin = async (req, res) => {
    try {
        const { email, passwordAdmin } = req.body;

        if (!email || !passwordAdmin) {
            return res.status(400).json({ message: "Các trường không được để trống!", status: false });
        }

        const checkAccount = await AccountModel.findOne({ email });

        if (!checkAccount) {
            return res.status(404).json({ message: "Email không tồn tại!", status: false });
        }

        const isPasswordValid = await bcrypt.compare(passwordAdmin + process.env.JWT_SECRET, checkAccount.passwordAdmin);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password không chính xác!", status: false });
        }

        const token = jwt.sign(
            { email: checkAccount.email, _id: checkAccount._id },
            process.env.JWT_SECRET,
            { expiresIn: "48h" }
        );

        res.status(200).json({
            message: "Đăng nhập thành công",
            user: { email: checkAccount.email, _id: checkAccount._id },
            status: true,
            token
        });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            message: 'Internal server error',
            error: error.message
        });
    }
};

const checkToken = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                isLogin: false,
                message: "Không có token, không được phép truy cập",
                status: false
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const account = await AccountModel.findById(decode._id).select("-passwordAdmin");

        if (!account) {
            return res.status(404).json({
                isLogin: false,
                message: "Tài khoản không tồn tại",
                status: false
            });
        }

        // Gọi user-service để lấy thông tin profile - gửi kèm token
        let accountProfile = null;
        try {
            const profileResponse = await axios.get(`${process.env.PORT_CHECK_PROFILE_USER_SERVICE}${account.user_id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (profileResponse.data.success) {
                accountProfile = profileResponse.data.data;
            }
        } catch (profileError) {
            console.log('Không thể lấy thông tin profile từ user-service:', profileError.message);
        }

        // Merge thông tin từ auth và user service
        const combinedAccountInfo = {
            ...account.toObject(),
            // Thêm thông tin từ user-service nếu có
            ...(accountProfile && {
                fullName: accountProfile.fullName,
                userImage: accountProfile.userImage,
                profileCreateAt: accountProfile.createAt,
                profileUpdateAt: accountProfile.updateAt
            })
        };

        return res.status(200).json({
            isLogin: true,
            message: "Truy vấn thông tin tài khoản từ token thành công",
            user: combinedAccountInfo
        });

    } catch (error) {
        console.error("Lỗi xác thực token:", error);
        return res.status(401).json({
            isLogin: false,
            message: "token hết hạn, xác thực không hợp lệ"
        });
    }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { access_token, refresh_token } = req.body;

    if (!access_token) {
      return res.status(400).json({ 
        message: "Yêu cầu access_token từ Google", 
        status: false 
      });
    }

    const { data: { user: supabaseUser }, error: authError } = await supabase.auth.getUser(access_token);

    if (authError || !supabaseUser) {
      console.error('Supabase auth error:', authError);
      return res.status(401).json({ 
        message: "Token Google không hợp lệ hoặc đã hết hạn", 
        status: false,
        error: authError?.message 
      });
    }

    const email = supabaseUser.email;
    const googleId = supabaseUser.id;
    const fullName = supabaseUser.user_metadata?.full_name 
                     || supabaseUser.user_metadata?.name 
                     || email.split('@')[0];
    const userImage = supabaseUser.user_metadata?.avatar_url 
                     || supabaseUser.user_metadata?.picture;

    // console.log('Google user info:', { email, googleId, fullName });

    // Tìm tài khoản trong MongoDB
    let account = await Account.findOne({ 
      $or: [
        { google_id: googleId },
        { email: email }
      ]
    });

    // Nếu chưa có tài khoản, tạo mới
    if (!account) {
      try {
        const randomPassword = `${Date.now()}_${Math.random().toString(36)}`;
        const hashedPassword = await bcrypt.hash(randomPassword + process.env.JWT_SECRET, 10);
        const userId = new mongoose.Types.ObjectId();

        account = new Account({
          _id: userId,
          user_id: userId,
          email: email,
          google_id: googleId,
          passwordAdmin: hashedPassword,
          isAdmin: false,
          isActive: true,
          createAt: new Date(),
          updateAt: new Date()
        });

        await account.save();

        // Gửi thông tin sang user-service
        try {
          await axios.post(process.env.PORT_CHECK_USER_SERVICE, {
            _id: userId,
            fullName: fullName,
            userImage: userImage,
            createAt: new Date(),
            updateAt: new Date()
          }, {
            headers: {
              'x-api-key': process.env.API_KEY,
              'Content-Type': 'application/json'
            }
          });
          console.log('Đã gửi thông tin người dùng đến user-service thành công');
        } catch (userServiceError) {
          console.error('Lỗi khi gửi thông tin người dùng đến user-service:', userServiceError.message);
        }

        console.log('Đã tạo tài khoản mới từ Google:', email);
      } catch (saveError) {
        if (saveError.code === 11000) {
          console.log('Phát hiện khóa trùng lặp, đang tìm tài khoản hiện có...');
          account = await Account.findOne({ 
            $or: [
              { google_id: googleId },
              { email: email }
            ]
          });

          if (!account) {
            throw new Error('Không thể tạo hoặc tìm thấy tài khoản');
          }
        } else {
          throw saveError;
        }
      }
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!account.isActive) {
      return res.status(403).json({
        message: "Tài khoản của người dùng đã bị khóa, vui lòng thử lại sau",
        status: false
      });
    }

    // Cập nhật thông tin nếu cần
    let needUpdate = false;

    if (!account.google_id && googleId) {
      account.google_id = googleId;
      needUpdate = true;
    }

    if (needUpdate) {
      account.updateAt = new Date();
      await account.save();
    }

    console.log('Tài khoản đã đăng nhập:', email);

    // Tạo JWT token
    const token = jwt.sign(
      { 
        email: account.email, 
        _id: account._id,
        isAdmin: account.isAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Loại bỏ password trước khi trả về
    const accountResponse = account.toObject();
    delete accountResponse.passwordAdmin;

    // Trả về response
    return res.status(200).json({
      message: "Đăng nhập bằng Google thành công",
      user: accountResponse,
      token: token,
      status: true
    });

  } catch (error) {
    console.error("Lỗi đăng nhập Google:", error);
    return res.status(500).json({
      message: "Lỗi server khi xác thực Google",
      error: error.message,
      status: false
    });
  }
};

const getAccountByUserId = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Không có token, không được phép truy cập"
            });
        }

        // Verify token
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        if (!decode) {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }

        const { user_id } = req.params;

        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: "Thiếu user_id"
            });
        }

        const account = await AccountModel.findOne({ user_id }).select("-passwordAdmin");

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        // Gọi survey-service để lấy thông tin onboarding status
        let onboardingStatus = null;
        try {
            const surveyResponse = await axios.get(`${process.env.PORT_CHECK_SURVEY_SERVICE}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'x-api-key': process.env.API_KEY,
                    'Content-Type': 'application/json'
                }
            });
            
            if (surveyResponse.data.status) {
                onboardingStatus = surveyResponse.data.data;
            }
        } catch (surveyError) {
            console.log('Không thể lấy thông tin onboarding từ survey-service:', surveyError.message);
        }

        // Gộp thông tin account với onboarding status
        const accountWithOnboarding = {
            ...account.toObject(),
            // Thêm thông tin onboarding nếu có
            isOnboardingCompleted: onboardingStatus?.isOnboardingCompleted || false,
            ...(onboardingStatus && {
                onboardingProfile: {
                    isFamily: onboardingStatus.isFamily,
                    personalInfo: onboardingStatus.personalInfo,
                    familyInfo: onboardingStatus.familyInfo,
                    dietaryPreferences: onboardingStatus.dietaryPreferences,
                    nutritionGoals: onboardingStatus.nutritionGoals,
                    waterReminders: onboardingStatus.waterReminders
                }
            })
        };

        res.status(200).json({
            success: true,
            data: accountWithOnboarding,
            message: "Lấy thông tin tài khoản thành công"
        });

    } catch (error) {
        console.error("Get account by user_id error:", error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi lấy thông tin tài khoản",
            error: error.message
        });
    }
};

const updateAccountStatus = async (req, res) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Không có token, không được phép truy cập"
            });
        }

        // Verify token và check admin
        const decode = jwt.verify(token, process.env.JWT_SECRET);
        const adminAccount = await AccountModel.findById(decode._id);

        if (!adminAccount || !adminAccount.isAdmin) {
            return res.status(403).json({
                success: false,
                message: "Chỉ admin mới có quyền thực hiện thao tác này"
            });
        }

        const { accountId } = req.params;
        const { isActive } = req.body;

        if (!accountId) {
            return res.status(400).json({
                success: false,
                message: "Thiếu accountId"
            });
        }

        const account = await AccountModel.findById(accountId);

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy tài khoản"
            });
        }

        // Không cho phép tự khóa chính mình
        if (account._id.toString() === adminAccount._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Không thể thay đổi trạng thái tài khoản của chính mình"
            });
        }

        account.isActive = isActive;
        account.updateAt = new Date();
        await account.save();

        res.status(200).json({
            success: true,
            message: `${isActive ? 'Mở khóa' : 'Khóa'} tài khoản thành công`,
            data: {
                accountId: account._id,
                email: account.email,
                isActive: account.isActive
            }
        });

    } catch (error) {
        console.error("Update account status error:", error);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: "Token không hợp lệ"
            });
        }
        res.status(500).json({
            success: false,
            message: "Lỗi server khi cập nhật trạng thái tài khoản",
            error: error.message
        });
    }
};

module.exports = { loginAdmin, checkToken, loginWithGoogle, getAccountByUserId, updateAccountStatus };