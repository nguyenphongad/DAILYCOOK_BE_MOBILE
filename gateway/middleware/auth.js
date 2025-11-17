const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  // Bỏ qua xác thực cho các endpoint đăng nhập và register-from-auth
  if (req.path.includes('/login-admin') || req.path.includes('/register-from-auth') || req.path.includes('/health')) {
    return next();
  }

  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Thiếu token hoặc định dạng không đúng');
      return res.status(401).json({
        status: 'error',
        message: 'Xác thực thất bại. Vui lòng đăng nhập.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    // Xác thực token
    const decoded = jwt.verify(token, config.jwt.secret);
    req.userData = decoded;
    
    // Thêm thông tin người dùng vào header để chuyển tiếp đến các service
    req.headers['x-user-id'] = decoded.userId || decoded._id;
    req.headers['x-user-role'] = decoded.role || 'user';
    req.headers['x-user-email'] = decoded.email;
    
    next();
  } catch (error) {
    logger.error(`Lỗi xác thực: ${error.message}`);
    return res.status(401).json({
      status: 'error',
      message: 'Xác thực thất bại. Token không hợp lệ hoặc đã hết hạn.'
    });
  }
};
