const IngredientCategories = require("../model/IngredientCategoriesModel");
const IngredientModel = require("../model/IngredientModel");
const mongoose = require("mongoose");

// Thêm nguyên liệu mới
const addIngredient = async (req, res) => {
    try {

        const {
            nameIngredient,
            description,
            ingredientCategories, // ID của danh mục nguyên liệu
            ingredientImage,
            defaultAmount,
            defaultUnit,
            nutrition,
            commonUses
        } = req.body;

        if (!nameIngredient || !ingredientCategories) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Thiếu thông tin bắt buộc: nameIngredient hoặc ingredientCategories!",
                status: false
            });
        }

        // Kiểm tra xem danh mục nguyên liệu có tồn tại không
        const category = await IngredientCategories.findById(ingredientCategories);
        if (!category) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Tạo mới nguyên liệu
        const newIngredient = new IngredientModel({
            nameIngredient,
            description,
            ingredientCategories: ingredientCategories,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            nutrition,
            commonUses
        });

        const result = await newIngredient.save();

        if (result) {
            return res.status(201).json({
                stype: "ingredient",
                message: "Thêm nguyên liệu thành công!",
                status: true,
                data: {
                    _id: result._id,
                    nameIngredient: result.nameIngredient,
                    description: result.description,
                    ingredientCategories: result.ingredientCategories,
                    ingredientImage: result.ingredientImage,
                    defaultAmount: result.defaultAmount,
                    defaultUnit: result.defaultUnit,
                    nutrition: result.nutrition,
                    commonUses: result.commonUses,
                    createAt: result.createdAt,
                    updateAt: result.updatedAt
                }
            });
        }

    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

module.exports = {
    addIngredient
};