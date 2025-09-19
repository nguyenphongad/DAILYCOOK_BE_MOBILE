const express = require('express');
const MealMiddleware = require('../middleware/MealMiddleware');
const { addMealCategory, updateMealCategory, deleteMealCategory, getListMealCategories, findByIdMealCategory } = require('../controllers/MealCategoryController');

const router = express.Router();

// meal categories
router.post('/add-meal-category', MealMiddleware, addMealCategory);
router.put('/update-meal-category/:meal_category_id', MealMiddleware, updateMealCategory);
router.delete('/delete-meal-category/:meal_category_id', MealMiddleware, deleteMealCategory);
router.get('/meal-categories', MealMiddleware, getListMealCategories);
router.get('/meal-category/:meal_category_id', MealMiddleware, findByIdMealCategory);

// meal


module.exports = router;