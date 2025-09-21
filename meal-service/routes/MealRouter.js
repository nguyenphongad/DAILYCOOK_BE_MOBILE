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
} = require('../controllers/MealController');

const router = express.Router();

/* ==========================   Meal Categories   ========================== */
router.post(
    '/add-meal-category',
    MealMiddleware,
    addMealCategory
);

router.put(
    '/update-meal-category/:meal_category_id',
    MealMiddleware,
    updateMealCategory
);

router.delete(
    '/delete-meal-category/:meal_category_id',
    MealMiddleware,
    deleteMealCategory
);

router.get(
    '/meal-categories',
    MealMiddleware,
    getListMealCategories
);

router.get(
    '/meal-category/:meal_category_id',
    MealMiddleware,
    findByIdMealCategory
);

/* ==========================   Meals   ========================== */
router.post(
    '/add-meal',
    MealMiddleware,
    addMeal
);

module.exports = router;
