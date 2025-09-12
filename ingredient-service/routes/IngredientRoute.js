const express = require('express');
const IngredientMiddleware = require('../middleware/ingredientsMiddleware');
const { addIngredientCategory, deleteIngredientCategory, getIngredientCategories, updateIngredientCategory, findByIdIngredientCategory } = require('../controllers/IngredientCategoryController');
const { addIngredient, updateIngredient, deleteIngredient, getIngredient, findByIdIngredient } = require('../controllers/ingredientController');

const router = express.Router();

// ingredient categories
router.post('/add-ingredient-category', IngredientMiddleware, addIngredientCategory);
router.put('/update-ingredient-category/:ingredient_category_id', IngredientMiddleware, updateIngredientCategory);
router.delete('/delete-ingredient-category/:ingredient_category_id', IngredientMiddleware, deleteIngredientCategory);
router.get('/ingredient-category', IngredientMiddleware, getIngredientCategories);
router.get('/ingredient-category/:ingredient_category_id', IngredientMiddleware, findByIdIngredientCategory);

// ingredient
router.post('/add-ingredient', IngredientMiddleware, addIngredient);
router.put('/update-ingredient/:ingredient_id', IngredientMiddleware, updateIngredient);
router.delete('/delete-ingredient/:ingredient_id', IngredientMiddleware, deleteIngredient);
router.get('/', IngredientMiddleware, getIngredient);
router.get('/:ingredient_id', IngredientMiddleware, findByIdIngredient);

module.exports = router