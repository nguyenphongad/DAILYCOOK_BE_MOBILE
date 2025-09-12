const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/RecipeController');
const recipeMiddleware = require('../middleware/RecipeMiddleware');

// Lấy tất cả công thức
router.get('/', recipeMiddleware.authenticateToken, recipeController.getAllRecipes);

// Lấy công thức theo ID
router.get('/:id', recipeMiddleware.authenticateToken, recipeController.getRecipeById);

// Tạo công thức mới
router.post('/add-recipe', 
    recipeMiddleware.authenticateToken,
    recipeMiddleware.validateRecipeInput,
    recipeController.createRecipe
);

// Cập nhật công thức
router.put('/update-recipe/:id', 
    recipeMiddleware.authenticateToken,
    recipeMiddleware.checkRecipeExists,
    recipeMiddleware.validateUpdateInput,
    recipeController.updateRecipe
);


// Xóa công thức (soft delete)
router.delete('/:id', 
    recipeMiddleware.authenticateToken,
    recipeMiddleware.checkRecipeExists,
    recipeController.deleteRecipe
);

// Xóa công thức
router.delete('/delete-recipe/:id', 
    recipeMiddleware.authenticateToken,
    recipeMiddleware.checkRecipeExists,
    recipeController.deleteRecipePermanently
);

module.exports = router;