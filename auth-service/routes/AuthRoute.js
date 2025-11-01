const express = require('express');
const { loginAdmin, checkToken, loginWithGoogle, getAccountByUserId } = require('../controllers/authController');

const router = express.Router();

// router.get("/checkToken", checkToken);
router.post("/login-admin", loginAdmin);
router.get("/check-token", checkToken);


router.post("/google-login", loginWithGoogle);

// Lấy thông tin account theo user_id (có thể dùng internal)
router.get("/account/:user_id", getAccountByUserId);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router