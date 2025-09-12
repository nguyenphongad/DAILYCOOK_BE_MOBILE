const Recipe = require('../models/RecipeModel');
const jwt = require("jsonwebtoken");

// Middleware để xác thực JWT
exports.authenticateToken = (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Lấy token từ header Authorization

        if (!token) {
            return res.status(401).json({
                stype: "recipe",
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
};

// Kiểm tra dữ liệu đầu vào khi tạo công thức
exports.validateRecipeInput = (req, res, next) => {
    const { nameRecipe, steps } = req.body;
    
    if (!nameRecipe) {
        return res.status(400).json({
            status: 'fail',
            message: 'Tên công thức là bắt buộc'
        });
    }
    
    if (steps && !Array.isArray(steps)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Các bước thực hiện phải là một mảng'
        });
    }
    
    if (steps && steps.length > 0) {
        for (const step of steps) {
            if (!step.stepNumber || !step.title || !step.description) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Mỗi bước phải có số bước, tiêu đề và mô tả'
                });
            }
        }
    }
    
    next();
};

// Kiểm tra xem công thức có tồn tại không
exports.checkRecipeExists = async (req, res, next) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        
        if (!recipe) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy công thức'
            });
        }
        
        req.recipe = recipe;
        next();
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Kiểm tra dữ liệu đầu vào khi cập nhật công thức
exports.validateUpdateInput = (req, res, next) => {
    const { difficulty } = req.body;
    
    if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
        return res.status(400).json({
            status: 'fail',
            message: 'Độ khó phải là một trong các giá trị: easy, medium, hard'
        });
    }
    
    next();
};