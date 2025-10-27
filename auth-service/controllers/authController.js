require('dotenv').config();
const UserModel = require('../model/UserModel');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabase');
const User = require('../model/UserModel');

const loginUser = async (req, res) => {
    try {
        const { email, passwordAdmin } = req.body;

        if (!email || !passwordAdmin) {
            return res.status(400).json({ message: "Các trường không được để trống!", status: false });
        }

        const checkUser = await UserModel.findOne({ email });

        if (!checkUser) {
            return res.status(404).json({ message: "Email không tồn tại!", status: false });
        }

        const isPasswordValid = await bcrypt.compare(passwordAdmin + process.env.JWT_SECRET, checkUser.passwordAdmin);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Password không chính xác!", status: false });
        }

        const token = jwt.sign(
            { email: checkUser.email, _id: checkUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "48h" }
        );

        res.status(200).json({
            message: "Đăng nhập thành công",
            user: { email: checkUser.email, _id: checkUser._id },
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
        const user = await UserModel.findById(decode._id).select("-passwordAdmin");

        if (!user) {
            return res.status(404).json({
                isLogin: false,
                message: "Người dùng không tồn tại",
                status: false
            });
        }

        return res.status(200).json({
            isLogin: true,
            message: "Truy vấn thông tin người dùng từ token thành công",
            user: user
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

    // Tìm user trong MongoDB
    let user = await User.findOne({ 
      $or: [
        { google_id: googleId },
        { email: email }
      ]
    });

    // Nếu chưa có user, tạo mới với try-catch để xử lý duplicate key
    if (!user) {
      try {
        const randomPassword = `${Date.now()}_${Math.random().toString(36)}`;
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = new User({
          fullName: fullName,
          email: email,
          google_id: googleId,
          userImage: userImage,
          passwordAdmin: hashedPassword,
          isAdmin: false,
          isActive: true,
          isOnboardingCompleted: false,
        });

        await user.save();
        console.log('Created new user from Google:', email);
      } catch (saveError) {
        // Nếu bị duplicate key error, tìm lại user
        if (saveError.code === 11000) {
          console.log('Duplicate key detected, finding existing user...');
          user = await User.findOne({ 
            $or: [
              { google_id: googleId },
              { email: email }
            ]
          });

          if (!user) {
            throw new Error('Unable to create or find user');
          }
        } else {
          throw saveError;
        }
      }
    }

    // Cập nhật thông tin nếu cần
    let needUpdate = false;

    if (!user.google_id && googleId) {
      user.google_id = googleId;
      needUpdate = true;
    }

    if (userImage && user.userImage !== userImage) {
      user.userImage = userImage;
      needUpdate = true;
    }

    if (needUpdate) {
      await user.save();
    }

    // console.log('User logged in:', email);

    // Tạo JWT token
    const token = jwt.sign(
      { 
        email: user.email, 
        _id: user._id,
        isAdmin: user.isAdmin 
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Loại bỏ password trước khi trả về
    const userResponse = user.toObject();
    delete userResponse.passwordAdmin;

    // Trả về response
    return res.status(200).json({
      message: "Đăng nhập bằng Google thành công",
      user: userResponse,
      token: token,
      status: true,
      isNewUser: !user.isOnboardingCompleted
    });

  } catch (error) {
    console.error("Google login error:", error);
    return res.status(500).json({
      message: "Lỗi server khi xác thực Google",
      error: error.message,
      status: false
    });
  }
};


module.exports = { loginUser, checkToken, loginWithGoogle };