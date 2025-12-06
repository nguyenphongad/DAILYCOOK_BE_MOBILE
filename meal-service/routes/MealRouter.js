const express = require('express');
const MealMiddleware = require('../middleware/MealMiddleware');

const {
    addMealCategory,
    updateMealCategory,
    deleteMealCategory,
    getListMealCategories,
    findByIdMealCategory,
} = require('../controllers/MealCategoryController');

const {
    addMeal,
    getListMeals,
    updateMeal,
    deleteMeal,
    getTotalMeals,
    getMealsByCategory
} = require('../controllers/MealController');

const { 
    updateDietType, 
    addDietType, 
    deleteDietType, 
    getListDietTypes, 
    findByIdDietType,
    findByKeywordDietType,
    getTotalDietTypes
} = require('../controllers/DietTypeController');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'meal-service',
    timestamp: new Date().toISOString()
  });
});

/* ==========================   Meal Categories   ========================== */
// Thêm mới một danh mục bữa ăn
router.post(
    '/add-meal-category',
    MealMiddleware,
    addMealCategory
);

// Cập nhật thông tin một danh mục bữa ăn
router.put(
    '/update-meal-category/:meal_category_id',
    MealMiddleware,
    updateMealCategory
);

// Xoá một danh mục bữa ăn
router.delete(
    '/delete-meal-category/:meal_category_id',
    MealMiddleware,
    deleteMealCategory
);

// Lấy danh sách các danh mục bữa ăn
router.get(
    '/meal-categories',
    MealMiddleware,
    getListMealCategories
);

// Lấy thông tin chi tiết một danh mục bữa ăn
router.get(
    '/meal-category/:meal_category_id',
    MealMiddleware,
    findByIdMealCategory
);

/* ==========================   Meals   ========================== */
// Lấy tổng số món ăn (cần admin auth)
router.get(
    "/total",
    MealMiddleware,
    getTotalMeals
);

// Lấy món ăn theo danh mục với phân trang
router.get(
    '/category/:meal_category_id',
    MealMiddleware,
    getMealsByCategory
);

// Thêm mới một bữa ăn
router.post(
    '/add-meal',
    MealMiddleware,
    addMeal
);

// Cập nhật thông tin một bữa ăn
router.put(
    '/update-meal/:meal_id',
    MealMiddleware,
    updateMeal
);

// Xoá một bữa ăn
router.delete(
    '/delete-meal/:meal_id',
    MealMiddleware,
    deleteMeal
);

// Lấy danh sách bữa ăn
router.get(
    "/",
    MealMiddleware,
    getListMeals
);

// Lấy thông tin chi tiết một bữa ăn
router.get(
    "/meal/:meal_id",
    MealMiddleware,
    getListMeals
);

/* ==========================   Diet Type   ========================== */
// Lấy tổng số chế độ ăn (cần admin auth)
router.get(
    "/diet-types/total",
    MealMiddleware,
    getTotalDietTypes
);

// Thêm mới một loại chế độ ăn uống
router.post(
    '/add-diet-type',
    MealMiddleware,
    addDietType
);

// Cập nhật thông tin một loại chế độ ăn uống
router.put(
    '/update-diet-type/:diet_type_id',
    MealMiddleware,
    updateDietType
);

// Xoá một loại chế độ ăn uống
router.delete(
    '/delete-diet-type/:diet_type_id',
    MealMiddleware,
    deleteDietType
);

// Lấy danh sách loại chế độ ăn uống
router.get(
    "/diet-types",
    MealMiddleware,
    getListDietTypes
);

// Tìm loại chế độ ăn uống theo keyword (đặt trước route :diet_type_id)
router.get(
    "/diet-type/keyword/:keyword",
    MealMiddleware,
    findByKeywordDietType
);

// Lấy thông tin chi tiết một loại chế độ ăn uống theo ID
router.get(
    "/diet-type/:diet_type_id",
    MealMiddleware,
    findByIdDietType
);

module.exports = router;
