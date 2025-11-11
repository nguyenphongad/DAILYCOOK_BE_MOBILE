const express = require('express');
const IngredientMiddleware = require('../middleware/ingredientsMiddleware');

const {
    addIngredientCategory,
    deleteIngredientCategory,
    updateIngredientCategory,
    findByIdIngredientCategory,
    getListIngredientCategories,
} = require('../controllers/IngredientCategoryController');

const {
    addIngredient,
    updateIngredient,
    deleteIngredient,
    findByIdIngredient,
    getListIngredient,
    getTotalIngredients
} = require('../controllers/IngredientController');
const { getAllMeasurementUnits } = require('../controllers/MeasurementUnitsController');

const router = express.Router();

/* ==========================    Ingredient Categories   ========================== */
router.post(
    '/add-ingredient-category',
    IngredientMiddleware,
    addIngredientCategory
);

router.put(
    '/update-ingredient-category/:ingredient_category_id',
    IngredientMiddleware,
    updateIngredientCategory
);

router.delete(
    '/delete-ingredient-category/:ingredient_category_id',
    IngredientMiddleware,
    deleteIngredientCategory
);

router.get(
    '/ingredient-categories',
    IngredientMiddleware,
    getListIngredientCategories
);

router.get(
    '/ingredient-category/:ingredient_category_id',
    IngredientMiddleware,
    findByIdIngredientCategory
);

/* ==========================   Ingredients   ========================== */
router.post(
    '/add-ingredient',
    IngredientMiddleware,
    addIngredient
);

router.put(
    '/update-ingredient/:ingredient_id',
    IngredientMiddleware,
    updateIngredient
);

router.delete(
    '/delete-ingredient/:ingredient_id',
    IngredientMiddleware,
    deleteIngredient
);

router.get(
    '/',
    IngredientMiddleware,
    getListIngredient
);

router.get(
    '/ingredient/:ingredient_id',
    IngredientMiddleware,
    findByIdIngredient
);

router.get(
    '/measurement-units',
    IngredientMiddleware,
    getAllMeasurementUnits
);

router.get(
    '/total',
    IngredientMiddleware,
    getTotalIngredients
);

module.exports = router;