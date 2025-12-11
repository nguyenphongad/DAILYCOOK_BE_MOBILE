const UserModel = require('../models/UserModel');
const mongoose = require('mongoose');
const axios = require('axios');

// Lấy danh sách tất cả người dùng (chỉ admin)
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search ? {
      fullName: { $regex: search, $options: 'i' }
    } : {};

    const users = await UserModel.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createAt: -1 });

    // Lấy token từ request header
    const token = req.header("Authorization");

    // Lấy thông tin account chi tiết cho từng user
    const usersWithAccountInfo = await Promise.all(
      users.map(async (user) => {
        try {
          // Gọi auth service để lấy thông tin account
          const accountResponse = await axios.get(
            `${process.env.PORT_AUTH_GET_ACCOUNT.replace(':user_id', user._id)}`,
            {
              headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
              }
            }
          );

          if (accountResponse.data.success) {
            // Merge thông tin user và account
            return {
              ...user.toObject(),
              accountInfo: accountResponse.data.data
            };
          } else {
            // Nếu không lấy được thông tin account, chỉ trả về user info
            return user.toObject();
          }
        } catch (accountError) {
          console.log(`Không thể lấy thông tin account cho user ${user._id}:`, accountError.message);
          // Nếu có lỗi, chỉ trả về user info
          return user.toObject();
        }
      })
    );

    const totalUsers = await UserModel.countDocuments(query);

    res.status(200).json({
      success: true,
      message: "Lấy danh sách người dùng thành công",
      data: usersWithAccountInfo,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: page,
      totalUsers
    });

  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người dùng",
      error: error.message
    });
  }
};

// Khóa/mở khóa người dùng - gọi auth service để cập nhật isActive
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;
    const token = req.header("Authorization");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Không có token, không được phép truy cập"
      });
    }

    // Gọi auth service để lấy thông tin account và cập nhật isActive
    try {
      const accountResponse = await axios.get(
        `${process.env.PORT_AUTH_GET_ACCOUNT.replace(':user_id', userId)}`,
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!accountResponse.data.success) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy tài khoản"
        });
      }

      // Cập nhật isActive trong auth service
      const updateResponse = await axios.patch(
        `${process.env.PORT_AUTH_STATUS_ACCOUNT.replace(':accountId', accountResponse.data.data._id)}`,
        { isActive },
        {
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json'
          }
        }
      );

      if (updateResponse.data.success) {
        res.status(200).json({
          success: true,
          message: `${isActive ? 'Mở khóa' : 'Khóa'} người dùng thành công`,
          data: {
            userId: userId,
            isActive: isActive
          }
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái người dùng"
        });
      }

    } catch (authError) {
      console.log(`Lỗi khi gọi auth service:`, authError.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi kết nối với auth service",
        error: authError.message
      });
    }

  } catch (error) {
    console.error("Toggle user status error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi thay đổi trạng thái người dùng",
      error: error.message
    });
  }
};

// Đăng ký user từ Auth Service
const registerFromAuth = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.API_KEY) {
      return res.status(401).json({ success: false, message: 'Không có quyền truy cập' });
    }

    const { _id, fullName, userImage, createAt, updateAt } = req.body;
    if (!_id || !fullName) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc (_id, fullName)' });
    }

    // Kiểm tra user đã tồn tại chưa
    const existed = await UserModel.findById(_id);
    if (existed) {
      return res.status(200).json({ success: true, message: 'Người dùng đã tồn tại', user: existed });
    }

    // Tạo user mới - sửa lỗi ObjectId constructor
    const user = new UserModel({
      _id: new mongoose.Types.ObjectId(_id),
      fullName,
      userImage,
      createAt: createAt || new Date(),
      updateAt: updateAt || new Date()
    });
    await user.save();

    res.status(201).json({ success: true, message: 'Tạo người dùng thành công', user });
  } catch (error) {
    console.error('Register from auth error:', error);
    res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
  }
};

// Lấy thông tin user theo user_id
const getUserByUserId = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: "Thiếu user_id"
      });
    }

    const user = await UserModel.findOne({ _id: user_id });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng"
      });
    }

    res.status(200).json({
      success: true,
      data: user,
      message: "Lấy thông tin người dùng thành công"
    });

  } catch (error) {
    console.error("Get user by user_id error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin người dùng",
      error: error.message
    });
  }
};

// Lấy tổng số người dùng - truy vấn đơn giản
const getTotalUsers = async (req, res) => {
  try {
    // Đếm tổng số người dùng
    const totalUsers = await UserModel.countDocuments();
    
    // Lấy 5 người dùng mới nhất
    const recentUsers = await UserModel.find()
      .sort({ createAt: -1 })
      .limit(5)
      .select('fullName createAt');

    const result = {
      totalUsers: totalUsers,
      exactCount: totalUsers,
      recentUsers: recentUsers
    };

    res.status(200).json({
      success: true,
      data: result,
      message: "Lấy tổng số người dùng thành công"
    });

  } catch (error) {
    console.error("Get total users error:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy tổng số người dùng",
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  toggleUserStatus,
  registerFromAuth,
  getUserByUserId,
  getTotalUsers
};
