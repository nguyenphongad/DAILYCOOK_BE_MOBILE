const axios = require('axios');

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization");
    if (!token) {
      return res.status(401).json({ success: false, message: "Không có token, không được phép truy cập" });
    }

    // Gọi tới auth service để xác thực và lấy user
    const response = await axios.get(process.env.PORT_AUTH_SERVICE, {
      headers: { 'Authorization': token }
    });

    if (!response.data.isLogin || !response.data.user?.isAdmin) {
      return res.status(403).json({ success: false, message: "Chỉ admin mới có quyền thực hiện thao tác này" });
    }

    req.user = response.data.user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Token không hợp lệ hoặc đã hết hạn" });
  }
};

module.exports = { adminAuthMiddleware };
