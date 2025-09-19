const IngredientCategoryModel = require("../model/IngredientCategoryModel");
const mongoose = require("mongoose");

// Thêm danh mục nguyên liệu mới
const addIngredientCategory = async (req, res) => {
    try {
        const { keyword, title, description } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!keyword || !title) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Thiếu thông tin bắt buộc (keyword, title)!",
                status: false
            });
        }

        // Kiểm tra xem keyword đã tồn tại chưa
        const existingCategory = await IngredientCategoryModel.findOne({ keyword });
        if (existingCategory) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục với từ khóa này đã tồn tại!",
                status: false
            });
        }

        // Tạo mới danh mục nguyên liệu
        const newIngredientCategory = new IngredientCategoryModel({ keyword, title, description });
        // Lưu vào database
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

// Update danh mục nguyên liệu
const updateIngredientCategory = async (req, res) => {
    try {
        const { ingredient_category_id } = req.params;
        const { keyword, title, description } = req.body;

        // Tìm danh mục theo id
        const ingredientCategory = await IngredientCategoryModel.findById(ingredient_category_id);
        if (!ingredientCategory) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Kiểm tra nếu có keyword mới
        if (keyword && keyword !== ingredientCategory.keyword) {
            // Kiểm tra keyword mới đã tồn tại chưa
            const existingKeyword = await IngredientCategoryModel.findOne({
                keyword: { $regex: new RegExp(`^${keyword}$`, 'i') },
                _id: { $ne: ingredient_category_id }
            });
            if (existingKeyword) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Keyword mới đã tồn tại!",
                    status: false
                });
            }
        }

        // Chuẩn bị object cập nhật
        const updateFields = {};
        if (keyword) updateFields.keyword = keyword;
        if (title) updateFields.title = title;
        if (description !== undefined) updateFields.description = description;

        // Kiểm tra xem có trường nào được cập nhật không
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Không có trường nào để cập nhật!",
                status: false
            });
        }

        // Thực hiện cập nhật
        const updated = await IngredientCategoryModel.findByIdAndUpdate(
            ingredient_category_id,
            updateFields,
            { new: true }
        );

        return res.status(200).json({
            stype: "ingredient",
            message: "Cập nhật danh mục nguyên liệu thành công!",
            status: true,
            data: {
                _id: updated._id,
                keyword: updated.keyword,
                title: updated.title,
                description: updated.description,
                createAt: updated.createdAt,
                updateAt: updated.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

// Xóa danh mục nguyên liệu
const deleteIngredientCategory = async (req, res) => {
    try {
        const { ingredient_category_id } = req.params;

        // Tìm kiếm danh mục
        const ingredientCategory = IngredientCategoryModel.findById(ingredient_category_id);
        if (!ingredientCategory) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Xóa danh mục nguyên liệu
        const result = await IngredientCategoryModel.findByIdAndDelete(ingredient_category_id);
        if (result) {
            return res.status(200).json({
                stype: "ingredient",
                message: "Xóa danh mục nguyên liệu thành công!",
                status: true,
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

// Đưa ra danh sách danh mục nguyên liệu
const getListIngredientCategories = async (req, res) => {
    try {
        const ingredientCategories = await IngredientCategoryModel.find();
        // Lấy tất cả danh mục nguyên liệu
        if (!ingredientCategories) {
            return res.status(404).json({
                stype: "ingredient",
                message: "Không tìm thấy danh sách danh mục nguyên liệu!",
                status: false
            })
        } else {
            return res.status(201).json({
                stype: "ingredient",
                message: "Danh sách danh mục nguyên liệu",
                status: true,
                data: ingredientCategories
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

// Tìm kiếm bằng id
const findByIdIngredientCategory = async (req, res) => {
    try {
        const { ingredient_category_id } = req.params;
        const ingredient_category = await IngredientCategoryModel.findById(ingredient_category_id);
        if (!ingredient_category) {
            return res.status(404).json({
                stype: "ingredient",
                message: "Không tìm thấy danh mục nguyên liệu!",
                status: false
            });
        }
        return res.status(200).json({
            stype: "ingredient",
            message: "Đã tìm thấy danh mục nguyên liệu",
            status: true,
            data: ingredient_category
        });
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
    addIngredientCategory,
    updateIngredientCategory,
    deleteIngredientCategory,
    getListIngredientCategories,
    findByIdIngredientCategory
};