const express = require('express');
const { loginAdmin, checkToken, loginWithGoogle } = require('../controllers/authController');

const router = express.Router();

// router.get("/checkToken", checkToken);
router.post("/login-admin", loginAdmin);
router.get("/check-token", checkToken);


router.post("/google-login", loginWithGoogle);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router