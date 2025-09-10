const IngredientCategories = require("../model/IngredientCategoriesModel");
const mongoose = require("mongoose");

// Thêm danh mục nguyên liệu mới
const addIngredientCategories = async (req, res) => {
    try {
        const { keyword, title, description } = req.body;

        if (!keyword || !title) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Thiếu thông tin bắt buộc (keyword, title)!",
                status: false
            });
        }

        // Kiểm tra xem keyword đã tồn tại chưa
        const existingCategory = await IngredientCategories.findOne({ keyword });
        if (existingCategory) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục với từ khóa này đã tồn tại!",
                status: false
            });
        }

        const newIngredientCategory = new IngredientCategories({
            keyword,
            title,
            description
        });

        const result = await newIngredientCategory.save();

        if (result) {
            return res.status(201).json({
                stype: "ingredient",
                message: "Thêm danh mục nguyên liệu thành công!",
                status: true,
                data: {
                    _id: result._id,
                    keyword: result.keyword,
                    title: result.title,
                    description: result.description,
                    createAt: result.createdAt,
                    updateAt: result.updatedAt
                }
            })
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
    addIngredientCategories
};