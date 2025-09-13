const express = require('express');
const {  loginUser, registerUser, checkToken } = require('../controllers/AuthController');

const router = express.Router();

// router.get("/checkToken", checkToken);
router.post("/login-admin", loginUser);

// Health check endpoint
// router.get('/health', (req, res) => {
//   res.status(200).json({
//     status: 'OK',
//     service: 'auth-service',
//     timestamp: new Date().toISOString()
//   });
// });

module.exports = router