const IngredientCategoryModel = require("../models/IngredientCategoryModel");
const IngredientModel = require("../models/IngredientModel");
const mongoose = require("mongoose");

// Thêm nguyên liệu mới
const addIngredient = async (req, res) => {
    try {
        const {
            code,
            nameIngredient,
            name_en,
            description,
            ingredientCategory,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            energy,
            nutrition,
            commonUses
        } = req.body;

        // Kiểm tra thông tin bắt buộc
        if (!nameIngredient) {
            return res.status(400).json({
                stype: "ingredient",
                message: "Thiếu thông tin bắt buộc: nameIngredient!",
                status: false
            });
        }

        // Kiểm tra trùng mã code nếu có
        if (code) {
            const existingCode = await IngredientModel.findOne({ code });
            if (existingCode) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Mã nguyên liệu đã tồn tại!",
                    status: false
                });
            }
        }

        // Xử lý category nếu có ingredientCategory ID
        let categoryId = ingredientCategory;
        if (ingredientCategory) {
            const categoryExists = await IngredientCategoryModel.findById(ingredientCategory);
            if (!categoryExists) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Danh mục nguyên liệu không tồn tại!",
                    status: false
                });
            }
        }

        // Kiểm tra trùng tên nguyên liệu
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
            code,
            nameIngredient,
            name_en,
            description,
            ingredientCategory: categoryId,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            energy,
            nutrition,
            commonUses
        });

        const result = await newIngredient.save();
        if (result) {
            return res.status(201).json({
                stype: "ingredient",
                message: "Thêm nguyên liệu thành công!",
                status: true,
                data: result
            });
        }
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Thêm nguyên liệu thất bại!",
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
            code,
            nameIngredient,
            name_en,
            description,
            ingredientCategory,
            ingredientImage,
            defaultAmount,
            defaultUnit,
            energy,
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

        // Kiểm tra mã code nếu thay đổi
        if (code && code !== ingredient.code) {
            const existingCode = await IngredientModel.findOne({
                code,
                _id: { $ne: ingredient_id }
            });
            if (existingCode) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Mã nguyên liệu đã tồn tại!",
                    status: false
                });
            }
        }

        // Kiểm tra tên nguyên liệu nếu thay đổi
        if (nameIngredient && nameIngredient !== ingredient.nameIngredient) {
            const existingNameIngredient = await IngredientModel.findOne({
                nameIngredient: { $regex: new RegExp(`^${nameIngredient}$`, 'i') },
                _id: { $ne: ingredient_id }
            });
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
        if (code !== undefined) updateFields.code = code;
        if (nameIngredient) updateFields.nameIngredient = nameIngredient;
        if (name_en !== undefined) updateFields.name_en = name_en;
        if (description !== undefined) updateFields.description = description;

        // Xử lý category ID nếu có
        if (ingredientCategory) {
            const categoryExists = await IngredientCategoryModel.findById(ingredientCategory);
            if (!categoryExists) {
                return res.status(400).json({
                    stype: "ingredient",
                    message: "Danh mục nguyên liệu không tồn tại!",
                    status: false
                });
            }
            updateFields.ingredientCategory = ingredientCategory;
        }

        if (ingredientImage !== undefined) updateFields.ingredientImage = ingredientImage;
        if (defaultAmount !== undefined) updateFields.defaultAmount = defaultAmount;
        if (defaultUnit !== undefined) updateFields.defaultUnit = defaultUnit;
        if (energy !== undefined) updateFields.energy = energy;
        if (nutrition !== undefined) updateFields.nutrition = nutrition;
        if (commonUses !== undefined) updateFields.commonUses = commonUses;

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
            data: updated
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Cập nhật nguyên liệu thất bại!",
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
            message: "Lấy danh sách thực phẩm thành công!",
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

// Lấy danh sách nguyên liệu RANDOM (cho trang đề xuất/khám phá)
const getRandomIngredients = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        
        const total = await IngredientModel.countDocuments();
        
        const ingredients = await IngredientModel.aggregate([
            { $sample: { size: limit } },
            {
                $lookup: {
                    from: 'ingredientcategories',
                    localField: 'ingredientCategory',
                    foreignField: '_id',
                    as: 'categoryDetail'
                }
            },
            {
                $unwind: {
                    path: '$categoryDetail',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    code: 1,
                    nameIngredient: 1,
                    name_en: 1,
                    description: 1,
                    category: 1,
                    categoryEn: 1,
                    ingredientImage: 1,
                    ingredientCategory: 1,
                    'categoryDetail.title': 1,
                    'categoryDetail.keyword': 1,
                    defaultAmount: 1,
                    defaultUnit: 1,
                    energy: 1,
                    nutrition: 1,
                    commonUses: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            }
        ]);

        return res.status(200).json({
            stype: "ingredient",
            message: "Lấy danh sách nguyên liệu random thành công!",
            status: true,
            data: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                ingredients,
                note: "Mỗi lần gọi API sẽ trả về nguyên liệu khác nhau (random)"
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lấy danh sách nguyên liệu random thất bại!",
            status: false,
            error: error.message
        });
    }
};

// Lấy danh sách nguyên liệu theo category với random
const getRandomIngredientsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        let { limit = 10 } = req.query;
        limit = parseInt(limit);

        const categoryExists = await IngredientModel.countDocuments({ 
            ingredientCategory: category_id 
        });

        if (categoryExists === 0) {
            return res.status(404).json({
                stype: "ingredient",
                message: "Không tìm thấy nguyên liệu nào trong danh mục này",
                status: false
            });
        }

        const ingredients = await IngredientModel.aggregate([
            { $match: { ingredientCategory: mongoose.Types.ObjectId(category_id) } },
            { $sample: { size: limit } },
            {
                $lookup: {
                    from: 'ingredientcategories',
                    localField: 'ingredientCategory',
                    foreignField: '_id',
                    as: 'categoryDetail'
                }
            },
            {
                $unwind: {
                    path: '$categoryDetail',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    code: 1,
                    nameIngredient: 1,
                    name_en: 1,
                    category: 1,
                    categoryEn: 1,
                    ingredientImage: 1,
                    energy: 1,
                    nutrition: 1,
                    defaultAmount: 1,
                    defaultUnit: 1,
                    'categoryDetail.title': 1,
                    'categoryDetail.keyword': 1
                }
            }
        ]);

        return res.status(200).json({
            stype: "ingredient",
            message: "Lấy nguyên liệu random theo danh mục thành công!",
            status: true,
            data: {
                category_id,
                total: categoryExists,
                limit,
                ingredients
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lấy nguyên liệu theo danh mục thất bại!",
            status: false,
            error: error.message
        });
    }
};

// Lấy danh sách nguyên liệu theo category với pagination
const getIngredientsByCategory = async (req, res) => {
    try {
        const { category_id } = req.params;
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);

        // Kiểm tra category tồn tại
        const categoryExists = await IngredientCategoryModel.findById(category_id);
        if (!categoryExists) {
            return res.status(404).json({
                stype: "ingredient",
                message: "Danh mục nguyên liệu không tồn tại",
                status: false
            });
        }

        const skip = (page - 1) * limit;

        // Đếm tổng số nguyên liệu trong category
        const total = await IngredientModel.countDocuments({ 
            ingredientCategory: category_id 
        });

        // Lấy danh sách nguyên liệu theo category
        const ingredients = await IngredientModel.find({ 
            ingredientCategory: category_id 
        })
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1, _id: -1 });

        return res.status(200).json({
            stype: "ingredient",
            message: "Lấy danh sách nguyên liệu theo danh mục thành công!",
            status: true,
            data: {
                category: categoryExists,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                ingredients
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "ingredient",
            message: "Lấy danh sách nguyên liệu theo danh mục thất bại!",
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
    getTotalIngredients,
    getRandomIngredients,
    getRandomIngredientsByCategory,
    getIngredientsByCategory
};