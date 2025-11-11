const IngredientCategoryModel = require("../model/IngredientCategoryModel");
const IngredientModel = require("../model/IngredientModel");
const mongoose = require("mongoose");

// Thêm nguyên liệu mới
const addIngredient = async (req, res) => {
    try {
        const {
            nameIngredient,
            description,
            ingredientCategory,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            nutrition,
            commonUses
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!nameIngredient || !ingredientCategory) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Thiếu thông tin bắt buộc: nameIngredient hoặc ingredientCategory!",
                status: false
            });
        }

        // Tìm danh mục theo keyword hoặc title (không phân biệt chữ hoa thường)
        // const category = await IngredientCategoryModel.findOne({
        //     $or: [
        //         { keyword: { $regex: new RegExp(`^${ingredientCategory}$`, 'i') } },
        //         { title: { $regex: new RegExp(`^${ingredientCategory}$`, 'i') } }
        //     ]
        // });
        const category = await IngredientCategoryModel.findById(ingredientCategory);
        if (!category) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Danh mục nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Kiểm tra trùng tên nguyên liệu (không phân biệt chữ hoa thường)
        const existingIngredient = await IngredientModel.findOne({
            nameIngredient: { $regex: new RegExp(`^${nameIngredient}$`, 'i') }
        });
        if (existingIngredient) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Nguyên liệu đã tồn tại!",
                status: false
            });
        }

        // Tạo mới nguyên liệu
        const newIngredient = new IngredientModel({
            nameIngredient,
            description,
            ingredientCategory: category._id,
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
                    ingredientCategory: result.ingredientCategory,
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
            message: "Thêm nguyên liệu thất bại!" + error.message,
            status: false,
            error: error.message
        });
    }
}

// Chỉnh sửa nguyên liệu
const updateIngredient = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        const {
            nameIngredient,
            description,
            ingredientCategory,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            nutrition,
            commonUses
        } = req.body;

        // Tìm nguyên liệu theo id
        const ingredient = await IngredientModel.findById(ingredient_id);
        if (!ingredient) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Kiểm tra tên nguyên liệu đã tồn tại chưa
        if (nameIngredient && nameIngredient !== ingredient.nameIngredient) {
            const existingNameIngredient = await IngredientModel.findOne({
                nameIngredient: { $regex: new RegExp(`^${nameIngredient}`, 'i') },
                _id: { $ne: ingredient_id }
            })
            if (existingNameIngredient) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Tên nguyên liệu đã tồn tại!",
                    status: false
                });
            }
        }

        // Chuẩn bị object cập nhật
        const updateFields = {};
        if (nameIngredient) updateFields.nameIngredient = nameIngredient;
        if (description) updateFields.description = description;

        // Xử lý category nếu có
        if (ingredientCategory) {
            // const category = await IngredientCategoryModel.findOne({
            //     $or: [
            //         { keyword: { $regex: new RegExp(`^${ingredientCategory}$`, 'i') } },
            //         { title: { $regex: new RegExp(`^${ingredientCategory}$`, 'i') } }
            //     ]
            // });
            const category = await IngredientCategoryModel.findById(ingredientCategory);
            if (!category) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Danh mục nguyên liệu không tồn tại!",
                    status: false
                });
            }
            updateFields.ingredientCategory = category._id;
        }

        if (ingredientImage) updateFields.ingredientImage = ingredientImage;
        if (defaultAmount) updateFields.defaultAmount = defaultAmount;
        if (defaultUnit) updateFields.defaultUnit = defaultUnit;
        if (nutrition) updateFields.nutrition = nutrition;
        if (commonUses) updateFields.commonUses = commonUses;

        // Thực hiện cập nhật
        const updated = await IngredientModel.findByIdAndUpdate(
            ingredient_id,
            updateFields,
            { new: true }
        );

        return res.status(200).json({
            stype: "ingredient",
            message: "Cập nhật nguyên liệu thành công!",
            status: true,
            data: {
                _id: updated._id,
                nameIngredient: updated.nameIngredient,
                description: updated.description,
                ingredientCategory: updated.ingredientCategory,
                ingredientImage: updated.ingredientImage,
                defaultAmount: updated.defaultAmount,
                defaultUnit: updated.defaultUnit,
                nutrition: updated.nutrition,
                commonUses: updated.commonUses,
                createAt: updated.createdAt,
                updateAt: updated.updatedAt
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Cập nhật nguyên liệu thất bại!" + error.message,
            status: false,
            error: error.message
        });
    }
};

// Xóa nguyên liệu
const deleteIngredient = async (req, res) => {
    try {
        const { ingredient_id } = req.params;

        // Tìm nguyên liệu theo id
        const ingredient = await IngredientModel.findById(ingredient_id);
        if (!ingredient) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Nguyên liệu không tồn tại!",
                status: false
            });
        }

        // Xóa nguyên liệu
        const result = await IngredientModel.findByIdAndDelete(ingredient_id);
        if (result) {
            return res.status(200).json({
                stype: "ingredient",
                message: "Xóa nguyên liệu thành công!",
                status: true,
            })
        }
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Xóa nguyên liệu thất bại",
            status: false,
            error: error.message
        });
    }
}

// Đưa ra danh sách nguyên liệu
const getListIngredient = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const total = await IngredientModel.countDocuments();
        const ingredients = await IngredientModel.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        return res.status(200).json({
            stype: "ingredient",
            message: "Lấy danh sách món ăn thành công!",
            status: true,
            data: {
                total,
                page,
                limit,
                ingredients
            }
        });
    }
    catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lấy danh sách món ăn thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Tìm kiếm bằng id
const findByIdIngredient = async (req, res) => {
    try {
        const { ingredient_id } = req.params;
        // Tìm nguyên liệu theo id
        const ingredient = await IngredientModel.findById(ingredient_id);
        if (!ingredient) {
            return res.status(404).json({
                stype: "ingredient",
                message: "Nguyên liệu không tồn tại!",
                status: false
            });
        }
        return res.status(200).json({
            stype: "ingredient",
            message: "Đã tìm thấy nguyên liệu",
            status: true,
            data: ingredient
        })
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lấy nguyên liệu thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Lấy tổng số nguyên liệu - truy vấn tối ưu
const getTotalIngredients = async (req, res) => {
    try {
        // Đếm tổng số nguyên liệu
        const totalIngredients = await IngredientModel.countDocuments();
        
        // Lấy 5 nguyên liệu mới nhất
        const recentIngredients = await IngredientModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('nameIngredient ingredientImage createdAt defaultUnit');

        const result = {
            totalIngredients: totalIngredients,
            exactCount: totalIngredients,
            recentIngredients: recentIngredients
        };

        res.status(200).json({
            stype: "ingredient",
            message: "Lấy tổng số nguyên liệu thành công!",
            status: true,
            data: result
        });

    } catch (error) {
        console.error("Get total ingredients error:", error);
        res.status(500).json({
            stype: "ingredient",
            message: "Lỗi server khi lấy tổng số nguyên liệu",
            status: false,
            error: error.message
        });
    }
};

module.exports = {
    addIngredient,
    updateIngredient,
    deleteIngredient,
    getListIngredient,
    findByIdIngredient,
    getTotalIngredients
};