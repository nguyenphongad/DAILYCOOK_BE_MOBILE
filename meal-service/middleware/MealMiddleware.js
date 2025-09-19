const jwt = require("jsonwebtoken");

// Middleware để xác thực JWT
const MealMiddleware = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Lấy token từ header Authorization

        if (!token) {
            return res.status(401).json({
                stype: "meal",
                message: "Không tìm thấy token, không được phép truy cập!",
            });
        }

        // Xác thực token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Lưu thông tin người dùng đã giải mã vào req.user
        next(); // Cho phép tiếp tục đến route handler

    } catch (error) {
        console.error("Lỗi xác thực token!", error);
        return res.status(401).json({
            message: "Token không hợp lệ!",
            isLogin: false
        });
    }
}

module.exports = MealMiddleware;