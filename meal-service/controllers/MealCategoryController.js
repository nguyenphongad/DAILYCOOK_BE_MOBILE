const mongoose = require("mongoose");
const MealCategoryModel = require("../model/MealCategoryModel");
const MealModel = require("../model/MealModel");

// Thêm danh mục bữa ăn mới
const addMealCategory = async (req, res) => {
    try {
        const { keyword, title, description } = req.body;
        if (!keyword || !title) {
            return res.status(400).json({
                stype: "meal",
                message: "Thiếu thông tin bắt buộc (keyword, title)!",
                status: false
            });
        }
        // Kiểm tra xem keyword đã tồn tại chưa
        const existingCategory = await MealCategoryModel.findOne({ keyword });
        if (existingCategory) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục với từ khóa này đã tồn tại!",
                status: false
            });
        }
        const newMealCategory = new MealCategoryModel({
            keyword: keyword.toUpperCase(),
            title,
            description
        });
        const result = await newMealCategory.save();
        if (result) {
            return res.status(201).json({
                stype: "meal",
                message: "Thêm danh mục bữa ăn thành công!",
                status: true,
                data: result
            })
        }
    }
    catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Thêm danh mục bữa ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Update danh mục bữa ăn
const updateMealCategory = async (req, res) => {
    try {
        const { meal_category_id } = req.params;
        const { keyword, title, description } = req.body;

        const mealCategory = await MealCategoryModel.findById(meal_category_id);
        if (!mealCategory) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục món ăn không tồn tại!",
                status: false
            });
        }

        // Kiểm tra nếu có keyword mới
        if (keyword && keyword !== mealCategory.keyword) {
            // Kiểm tra keyword mới đã tồn tại chưa
            const existingKeyword = await MealCategoryModel.findOne({
                keyword: { $regex: new RegExp(`^${keyword}$`, 'i') },
                _id: { $ne: meal_category_id }
            });
            if (existingKeyword) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Keyword mới đã tồn tại!",
                    status: false
                });
            }
        }

        // Chuẩn bị các trường cần cập nhật
        const updateFields = {};
        if (keyword) updateFields.keyword = keyword.toUpperCase();
        if (title) updateFields.title = title;
        if (description) updateFields.description = description;

        // Kiểm tra xem có trường nào được cập nhật không
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Không có trường nào để cập nhật!",
                status: false
            });
        }

        // Thực hiện cập nhật
        const updated = await MealCategoryModel.findByIdAndUpdate(
            meal_category_id,
            updateFields,
            { new: true }
        )
        if (updated) {
            return res.status(200).json({
                stype: "meal",
                message: "Cập nhật danh mục bữa ăn thành công!",
                status: true,
                data: updated
            });
        }
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Cập nhật danh mục bữa ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Xóa danh mục bữa ăn
const deleteMealCategory = async (req, res) => {
    try {
        const { meal_category_id } = req.params;
        const mealCategory = await MealCategoryModel.findById(meal_category_id);
        if (!mealCategory) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục bữa ăn không tồn tại!",
                status: false
            });
        }
        await MealCategoryModel.findByIdAndDelete(meal_category_id);
        return res.status(200).json({
            stype: "meal",
            message: "Xóa danh mục bữa ăn thành công!",
            status: true
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Xóa danh mục bữa ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Danh sách danh mục bữa ăn với phân trang
const getListMealCategories = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const total = await MealCategoryModel.countDocuments();
        const mealCategories = await MealCategoryModel.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        return res.status(200).json({
            stype: "meal",
            message: "Danh sách danh mục bữa ăn",
            status: true,
            data: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                mealCategories
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Lấy danh mục bữa ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Tìm danh mục bữa ăn theo ID
const findByIdMealCategory = async (req, res) => {
    try {
        const { meal_category_id } = req.params;
        const mealCategory = await MealCategoryModel.findById(meal_category_id);
        if (!mealCategory) {
            return res.status(400).json({
                stype: "meal",
                message: "Danh mục bữa ăn không tồn tại!",
                status: false
            });
        }
        return res.status(200).json({
            stype: "meal",
            message: "Thông tin danh mục bữa ăn",
            status: true,
            data: mealCategory
        });
    } catch (error) {
        return res.status(500).json({
            stype: "meal",
            message: "Thông tin danh mục bữa ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

module.exports = {
    addMealCategory,
    updateMealCategory,
    deleteMealCategory,
    getListMealCategories,
    findByIdMealCategory
};