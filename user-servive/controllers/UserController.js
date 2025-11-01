const UserModel = require('../models/UserModel');
const mongoose = require('mongoose');

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

    const totalUsers = await UserModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: users,
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

// Khóa/mở khóa người dùng - bỏ vì model không có isActive
const toggleUserStatus = async (req, res) => {
  try {
    return res.status(400).json({
      success: false,
      message: "Chức năng này không khả dụng với model hiện tại"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi server",
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

module.exports = {
  getAllUsers,
  toggleUserStatus,
  registerFromAuth,
  getUserByUserId
};
