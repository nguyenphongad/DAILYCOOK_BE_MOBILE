const express = require('express');
const IngredientMiddleware = require('../middleware/IngredientsMiddleware');

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
    getTotalIngredients,
    getRandomIngredients, // Import API mới
    getRandomIngredientsByCategory // Import API mới
} = require('../controllers/IngredientController');
const { getAllMeasurementUnits } = require('../controllers/MeasurementUnitsController');
const { getNutritionData } = require('../controllers/NutritionProxyController');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'ingredient-service',
    timestamp: new Date().toISOString()
  });
});

/* ==========================   Nutrition Proxy API   ========================== */
// API proxy để lấy dữ liệu dinh dưỡng từ viendinhduong.vn (tránh CORS)
router.get(
    '/nutrition-proxy',
    IngredientMiddleware,
    getNutritionData
);

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

// ✅ API Random Ingredients (đặt TRƯỚC route '/')
router.get(
    '/random',
    IngredientMiddleware,
    getRandomIngredients
);

// ✅ API Random Ingredients theo Category
router.get(
    '/random/category/:category_id',
    IngredientMiddleware,
    getRandomIngredientsByCategory
);

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