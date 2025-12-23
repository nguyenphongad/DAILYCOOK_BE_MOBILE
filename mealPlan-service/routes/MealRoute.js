const express = require('express');
const router = express.Router();
const MealPlanController = require('../controller/MealPlanController');
const FallbackMealPlanController = require('../controller/FallbackMealPlanController');
const CacheMealPlanController = require('../controller/CacheMealPlanController'); // ✅ Import mới
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

// Tạo thực đơn bằng AI dựa trên user profile
router.post('/generate-ai', MealPlanController.generateAIMealPlan);

// ✅ Tạo thực đơn bằng Fallback (không dùng AI) - delay 4s
router.post('/generate-fallback', FallbackMealPlanController.generateFallbackMealPlan);

// Lấy thực đơn từ REDIS (cache) - nhanh nhưng có thể không có
router.post('/get-from-cache', MealPlanController.getMealPlanFromCache);

// Lấy thực đơn từ DATABASE - chính xác, có đầy đủ chi tiết
router.post('/get-from-database', MealPlanController.getMealPlanFromDatabase);

// Gợi ý món ăn tương tự
router.get('/similar/:mealId', MealPlanController.getSimilarMeals);


// Đổi món trong thực đơn
router.put('/replace-meal', MealPlanController.replaceMeal);

// Xóa món khỏi thực đơn
router.delete('/remove-meal', MealPlanController.removeMeal);

// ✅ Lưu meal plan vào cache (trước khi save vào DB)
router.post('/cache', CacheMealPlanController.cacheMealPlan);

// Lưu thực đơn vào database
router.post('/save', MealPlanController.saveMealPlan);

// ============= MEAL HISTORY ROUTES =============
// Toggle trạng thái "Đã ăn" (tick/untick)
router.post('/toggle-eaten', MealPlanController.toggleMealEatenStatus);

// Lấy lịch sử ăn uống (có lọc món đã ăn)
router.get('/history', MealPlanController.getMealHistory);

// Lấy trạng thái cuối cùng của một món
router.get('/meal-status', MealPlanController.getLastMealStatus);

module.exports = router;
