const express = require('express');
const { loginAdmin, checkToken, loginWithGoogle, getAccountByUserId, updateAccountStatus } = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     LoginAdmin:
 *       type: object
 *       required:
 *         - email
 *         - passwordAdmin
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@example.com
 *         passwordAdmin:
 *           type: string
 *           example: password123
 *     GoogleLogin:
 *       type: object
 *       required:
 *         - access_token
 *       properties:
 *         access_token:
 *           type: string
 *           example: ya29.a0AfH6SMCJ...
 *         refresh_token:
 *           type: string
 *           example: 1//04xxxxxxxxxxx
 *     UpdateAccountStatus:
 *       type: object
 *       required:
 *         - isActive
 *       properties:
 *         isActive:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/auth/login-admin:
 *   post:
 *     summary: Đăng nhập admin
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginAdmin'
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 status:
 *                   type: boolean
 *                 token:
 *                   type: string
 *       400:
 *         description: Thiếu thông tin đăng nhập
 *       404:
 *         description: Email không tồn tại
 *       401:
 *         description: Password không chính xác
 */
router.post("/login-admin", loginAdmin);

/**
 * @swagger
 * /api/auth/check-token:
 *   get:
 *     summary: Kiểm tra token và lấy thông tin user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token hợp lệ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isLogin:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *       401:
 *         description: Token không hợp lệ hoặc hết hạn
 */
router.get("/check-token", checkToken);

/**
 * @swagger
 * /api/auth/google-login:
 *   post:
 *     summary: Đăng nhập bằng Google
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GoogleLogin'
 *     responses:
 *       200:
 *         description: Đăng nhập Google thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   type: object
 *                 token:
 *                   type: string
 *                 status:
 *                   type: boolean
 *       400:
 *         description: Thiếu access_token
 *       401:
 *         description: Token Google không hợp lệ
 *       403:
 *         description: Tài khoản bị khóa
 */
router.post("/google-login", loginWithGoogle);

/**
 * @swagger
 * /api/auth/account/{user_id}:
 *   get:
 *     summary: Lấy thông tin account theo user_id
 *     tags: [Account Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của user
 *     responses:
 *       200:
 *         description: Lấy thông tin thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *       401:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.get("/account/:user_id", getAccountByUserId);

/**
 * @swagger
 * /api/auth/{accountId}/status:
 *   patch:
 *     summary: Cập nhật trạng thái account (chỉ admin)
 *     tags: [Account Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: accountId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của account cần cập nhật
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAccountStatus'
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Token không hợp lệ
 *       403:
 *         description: Chỉ admin mới có quyền
 *       404:
 *         description: Không tìm thấy tài khoản
 */
router.patch("/:accountId/status", updateAccountStatus);

/**
 * @swagger
 * /api/auth/health:
 *   get:
 *     summary: Kiểm tra trạng thái service
 *     tags: [Health Check]
 *     responses:
 *       200:
 *         description: Service hoạt động bình thường
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 service:
 *                   type: string
 *                   example: auth-service
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

module.exports = router