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
} = require('../controllers/MealController');

const router = express.Router();

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

module.exports = router;
