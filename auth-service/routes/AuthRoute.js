const express = require('express');
const { loginAdmin, checkToken, loginWithGoogle, getAccountByUserId, updateAccountStatus } = require('../controllers/authController');

const router = express.Router();

// router.get("/checkToken", checkToken);
router.post("/login-admin", loginAdmin);
router.get("/check-token", checkToken);


router.post("/google-login", loginWithGoogle);

// Lấy thông tin account theo user_id (có thể dùng internal)
router.get("/account/:user_id", getAccountByUserId);

// Cập nhật trạng thái account (chỉ admin)
router.patch("/:accountId/status", updateAccountStatus);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router