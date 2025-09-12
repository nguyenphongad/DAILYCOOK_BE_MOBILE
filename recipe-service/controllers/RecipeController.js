const Recipe = require('../models/RecipeModel');

// Lấy tất cả công thức
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await Recipe.find({ isActive: true });
        res.status(200).json({
            status: 'success',
            results: recipes.length,
            data: recipes
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Lấy công thức theo ID
exports.getRecipeById = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe || !recipe.isActive) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy công thức'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: recipe
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Tạo công thức mới
exports.createRecipe = async (req, res) => {
    try {
        const newRecipe = await Recipe.create(req.body);
        
        res.status(201).json({
            status: 'success',
            data: newRecipe
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Cập nhật công thức
exports.updateRecipe = async (req, res) => {
    try {
        const updatedRecipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        
        if (!updatedRecipe) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy công thức'
            });
        }
        
        res.status(200).json({
            status: 'success',
            data: updatedRecipe
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Xóa công thức (soft delete)
exports.deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );
        
        if (!recipe) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy công thức'
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Công thức đã được xóa'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Xóa công thức vĩnh viễn
exports.deleteRecipePermanently = async (req, res) => {
    try {
        const recipe = await Recipe.findByIdAndDelete(req.params.id);
        
        if (!recipe) {
            return res.status(404).json({
                status: 'fail',
                message: 'Không tìm thấy công thức'
            });
        }
        
        res.status(200).json({
            status: 'success',
            message: 'Công thức đã được xóa vĩnh viễn'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};