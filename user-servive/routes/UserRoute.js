const express = require('express');
const { adminAuthMiddleware } = require('../middleware/UserMiddleware');
const { getAllUsers, toggleUserStatus, registerFromAuth } = require('../controllers/UserController');
const UserModel = require('../models/UserModel');
const mongoose = require('mongoose');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'user-service',
    timestamp: new Date().toISOString()
  });
});

// Đăng ký user từ Auth Service (không cần middleware, chỉ cần API key)
router.post('/register-from-auth', registerFromAuth);

// Các route dưới đây chỉ cho phép admin
router.use(adminAuthMiddleware);

// Lấy danh sách tất cả người dùng
router.get('/', getAllUsers);

// Khoá/mở khoá người dùng
router.patch('/:userId/status', toggleUserStatus);

module.exports = router;
