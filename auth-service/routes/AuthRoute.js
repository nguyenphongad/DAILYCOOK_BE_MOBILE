const express = require('express');
const { loginAdmin, checkToken, loginWithGoogle, getAccountByUserId, updateAccountStatus } = require('../controllers/authController');

const router = express.Router();

router.post("/login-admin", loginAdmin);
router.get("/check-token", checkToken);
router.post("/google-login", loginWithGoogle);
router.get("/account/:user_id", getAccountByUserId);
router.patch("/:accountId/status", updateAccountStatus);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router