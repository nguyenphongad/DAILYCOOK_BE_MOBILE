const axios = require('axios');

const surveyMiddleware = {
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
                headers: { Authorization: authHeader }
            });

            if (response.data.isLogin) {
                req.user = response.data.user;
                next();
            } else {
                return res.status(401).json({
                    type: "VERIFY_TOKEN",
                    status: false,
                    message: "Token không hợp lệ"
                });
            }
        } catch (error) {
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
