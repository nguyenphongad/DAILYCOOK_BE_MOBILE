const express = require('express');
const router = express.Router();
const MealPlanController = require('../controller/MealPlanController');
const { authenticateUser, validateApiKey } = require('../middleware/MealPlanMiddleware');

// Middleware cho tất cả routes
router.use(validateApiKey);
router.use(authenticateUser);

// Tạo thực đơn bằng AI
router.post('/generate', MealPlanController.generateMealPlan);

// Lấy thực đơn
router.get('/', MealPlanController.getMealPlan);

// Tìm món tương tự
router.get('/similar/:mealId', MealPlanController.findSimilarMeals);

// Đổi món trong thực đơn
router.put('/replace-meal', MealPlanController.replaceMeal);

// Xóa món khỏi thực đơn
router.delete('/remove-meal', MealPlanController.removeMeal);

// Lưu thực đơn vào database
router.post('/save', MealPlanController.saveMealPlan);

module.exports = router;
