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
const { updateDietType, addDietType, deleteDietType, getListDietTypes, findByIdDietType } = require('../controllers/DietTypeController');

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

/* ==========================   Diet Type   ========================== */
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
    "/",
    MealMiddleware,
    getListDietTypes
);

// Lấy thông tin chi tiết một loại chế độ ăn uống
router.get(
    "/diet-type/:diet_type_id",
    MealMiddleware,
    findByIdDietType
);

module.exports = router;
