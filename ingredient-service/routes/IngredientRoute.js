const express = require('express');
const IngredientMiddleware = require('../middleware/ingredientsMiddleware');
const { addIngredientCategories } = require('../controllers/IngredientCategroriesController');
const { addIngredient } = require('../controllers/ingredientController');

const router = express.Router();

// ingredient categories
router.post('/add-ingredient-categories', IngredientMiddleware, addIngredientCategories);

// ingredient
router.post('/add-ingredient', IngredientMiddleware, addIngredient);

module.exports = router