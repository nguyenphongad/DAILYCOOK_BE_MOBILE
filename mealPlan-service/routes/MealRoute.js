const express = require('express');
const router = express.Router();
const MealPlanController = require('../controller/MealPlanController');
const { authenticateUser, validateApiKey } = require('../middleware/MealPlanMiddleware');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'mealPlan-service',
    timestamp: new Date().toISOString()
  });
});

// Middleware cho tất cả routes
router.use(validateApiKey);
router.use(authenticateUser);

// Tạo thực đơn (random meals với chi tiết đầy đủ)
router.post('/generate', MealPlanController.generateMealPlan);

// Lấy thực đơn
router.get('/', MealPlanController.getMealPlan);

// Gợi ý món ăn tương tự
router.get('/similar/:mealId', MealPlanController.getSimilarMeals);


// Đổi món trong thực đơn
router.put('/replace-meal', MealPlanController.replaceMeal);

// Xóa món khỏi thực đơn
router.delete('/remove-meal', MealPlanController.removeMeal);

// Lưu thực đơn vào database
router.post('/save', MealPlanController.saveMealPlan);


module.exports = router;
