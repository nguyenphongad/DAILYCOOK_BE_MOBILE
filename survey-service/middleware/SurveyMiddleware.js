const axios = require('axios');

const surveyMiddleware = {
    // Middleware kiểm tra API key - đọc từ .env
    verifyApiKey: (req, res, next) => {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey || apiKey !== process.env.API_KEY) {
            return res.status(403).json({
                type: "VERIFY_API_KEY",
                status: false,
                message: "API key không hợp lệ hoặc thiếu"
            });
        }

        next();
    },

    verifyToken: async (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                type: "VERIFY_TOKEN",
                status: false,
                message: "Không tìm thấy token xác thực"
            });
        }

        try {
            const response = await axios.get(process.env.PORT_AUTH_SERVICE, {
                headers: { 
                    Authorization: authHeader,
                    'x-api-key': process.env.API_KEY
                }
            });

            // console.log('Auth service response:', response.data); // Debug log

            if (response.data.isLogin) {
                req.user = response.data.user;
                // console.log('Set req.user:', req.user); // Debug log
                next();
            } else {
                return res.status(401).json({
                    type: "VERIFY_TOKEN",
                    status: false,
                    message: "Token không hợp lệ"
                });
            }
        } catch (error) {
            console.error('Verify token error:', error); // Debug log
            return res.status(403).json({
                type: "VERIFY_TOKEN",
                status: false,
                message: "Lỗi xác thực token",
                error: error.message
            });
        }
    },

    verifyAdmin: (req, res, next) => {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                type: "VERIFY_ADMIN",
                status: false,
                message: "Không có quyền truy cập"
            });
        }
        next();
    }
};

module.exports = surveyMiddleware;
