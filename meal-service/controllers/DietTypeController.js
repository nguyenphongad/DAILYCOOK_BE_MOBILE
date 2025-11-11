const mongoose = require("mongoose");
const DietTypeModel = require("../model/DietTypeModel");

// Thêm Loại chế độ ăn uống mới
const addDietType = async (req, res) => {
    try {
        const { 
            keyword, 
            title, 
            dietTypeImage, 
            description, 
            descriptionDetail, 
            researchSource,
            nutrition  // Thêm thông tin dinh dưỡng 
        } = req.body;
        
        // Kiểm tra thông tin bắt buộc
        if (!keyword || !title) {
            return res.status(400).json({
                stype: "diet type",
                message: "Thiếu thông tin bắt buộc (keyword, title)!",
                status: false
            });
        }

        // Kiểm tra xem keyword đã tồn tại chưa
        const existingDietType = await DietTypeModel.findOne({ keyword });
        if (existingDietType) {
            return res.status(400).json({
                stype: "diet type",
                message: "Loại chế độ ăn uống với từ khóa này đã tồn tại!",
                status: false
            });
        }

        // Tạo đối tượng mới với nutrition
        const newDietType = new DietTypeModel({
            keyword: keyword.toUpperCase(),
            title,
            dietTypeImage,
            description,
            descriptionDetail,
            researchSource,
            nutrition: nutrition || {
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            }
        });
        
        const result = await newDietType.save();
        if (result) {
            return res.status(201).json({
                stype: "diet type",
                message: "Thêm loại chế độ ăn uống thành công!",
                status: true,
                data: result
            })
        }
    } catch (error) {
        return res.status(500).json({
            stype: "diet type",
            message: "Thêm loại chế độ ăn uống thất bại!",
            status: false,
            error: error.message
        });
    }
}

// update loại chế độ ăn uống
const updateDietType = async (req, res) => {
    try {
        const { diet_type_id } = req.params;
        const { 
            keyword, 
            title, 
            dietTypeImage, 
            description, 
            descriptionDetail, 
            researchSource,
            nutrition  // Thêm thông tin dinh dưỡng 
        } = req.body;

        const dietType = await DietTypeModel.findById(diet_type_id);
        if (!dietType) {
            return res.status(400).json({
                stype: "diet type",
                message: "Loại chế độ ăn uống không tồn tại!",
                status: false
            });
        }

        // Kiểm tra nếu có keyword mới
        if (keyword && keyword !== dietType.keyword) {
            const existingDietType = await DietTypeModel.findOne({
                keyword: { $regex: new RegExp(`^${keyword}$`, 'i') },
                _id: { $ne: diet_type_id }
            })
            if (existingDietType) {
                return res.status(400).json({
                    stype: "diet type",
                    message: "Loại chế độ ăn uống với từ khóa này đã tồn tại!",
                    status: false
                });
            }
        }

        // Chuẩn bị các trường cần cập nhật
        const updateFields = {};
        if (keyword) updateFields.keyword = keyword.toUpperCase();
        if (title) updateFields.title = title;
        if (dietTypeImage) updateFields.dietTypeImage = dietTypeImage;
        if (description) updateFields.description = description;
        if (descriptionDetail) updateFields.descriptionDetail = descriptionDetail;
        if (researchSource) updateFields.researchSource = researchSource;
        
        // Thêm logic cập nhật thông tin dinh dưỡng
        if (nutrition) {
            // Nếu có giá trị dinh dưỡng mới, cập nhật từng trường
            updateFields.nutrition = {};
            
            // Chỉ cập nhật các giá trị dinh dưỡng được cung cấp
            if (nutrition.calories !== undefined) updateFields.nutrition.calories = nutrition.calories;
            if (nutrition.protein !== undefined) updateFields.nutrition.protein = nutrition.protein;
            if (nutrition.carbs !== undefined) updateFields.nutrition.carbs = nutrition.carbs;
            if (nutrition.fat !== undefined) updateFields.nutrition.fat = nutrition.fat;
            
            // Nếu không có trường nutrition nào được cập nhật, xóa trường nutrition
            if (Object.keys(updateFields.nutrition).length === 0) {
                delete updateFields.nutrition;
            }
        }

        // Kiểm tra xem có trường nào được cập nhật không
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({
                stype: "diet type",
                message: "Không có trường nào được cập nhật!",
                status: false
            });
        }

        // Thực hiện cập nhật
        const updated = await DietTypeModel.findByIdAndUpdate(
            diet_type_id,
            updateFields,
            { new: true }
        )
        if (updated) {
            return res.status(200).json({
                stype: "diet type",
                message: "Cập nhật loại chế độ ăn uống thành công!",
                status: true,
                data: updated
            });
        }
    } catch (error) {
        return res.status(500).json({
            stype: "diet type",
            message: "Cập nhật loại chế độ ăn uống thất bại",
            status: false,
            error: error.message
        });
    }
}

// Xóa loại chế độ ăn uống
const deleteDietType = async (req, res) => {
    try {
        const { diet_type_id } = req.params;
        const dietType = await DietTypeModel.findById(diet_type_id);
        if (!dietType) {
            return res.status(400).json({
                stype: "diet type",
                message: "Loại chế độ ăn uống không tồn tại!",
                status: false
            });
        }
        await DietTypeModel.findByIdAndDelete(diet_type_id);
        return res.status(200).json({
            stype: "diet type",
            message: "Xóa loại chế độ ăn uống thành công!",
            status: true
        });
    } catch (error) {
        return res.status(500).json({
            stype: "diet type",
            message: "Xóa loại chế độ ăn uống thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Danh sách loại chế độ ăn uống với phân trang
const getListDietTypes = async (req, res) => {
    try {
        let { page = 1, limit = 10 } = req.query;
        page = parseInt(page);
        limit = parseInt(limit);
        const skip = (page - 1) * limit;
        const total = await DietTypeModel.countDocuments();
        const dietTypes = await DietTypeModel.find()
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        return res.status(200).json({
            stype: "diet type",
            message: "Lấy danh sách loại chế độ ăn uống thành công!",
            status: true,
            data: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                dietTypes
            }
        });
    } catch (error) {
        return res.status(500).json({
            stype: "diet type",
            message: "Lấy danh sách loại chế độ ăn uống thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Tìm loại chế độ ăn uống theo ID
const findByIdDietType = async (req, res) => {
    try {
        const { diet_type_id } = req.params;
        const dietType = await DietTypeModel.findById(diet_type_id);
        if (!dietType) {
            return res.status(400).json({
                stype: "diet type",
                message: "Loại chế độ ăn uống không tồn tại!",
                status: false
            });
        }
        return res.status(200).json({
            stype: "diet type",
            message: "Lấy thông tin loại chế độ ăn uống thành công!",
            status: true,
            data: dietType
        });
    } catch (error) {
        return res.status(500).json({
            stype: "diet type",
            message: "Lấy thông tin chế độ ăn uống thất bại!",
            status: false,
            error: error.message
        });
    }
}

// Lấy tổng số chế độ ăn - truy vấn tối ưu
const getTotalDietTypes = async (req, res) => {
    try {
        // Đếm tổng số chế độ ăn
        const totalDietTypes = await DietTypeModel.countDocuments();
        
        // Lấy 5 chế độ ăn mới nhất
        const recentDietTypes = await DietTypeModel.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('keyword title dietTypeImage createdAt');

        const result = {
            totalDietTypes: totalDietTypes,
            exactCount: totalDietTypes,
            recentDietTypes: recentDietTypes
        };

        res.status(200).json({
            stype: "diet type",
            message: "Lấy tổng số chế độ ăn thành công!",
            status: true,
            data: result
        });

    } catch (error) {
        console.error("Get total diet types error:", error);
        res.status(500).json({
            stype: "diet type",
            message: "Lỗi server khi lấy tổng số chế độ ăn",
            status: false,
            error: error.message
        });
    }
};

module.exports = {
    addDietType,
    updateDietType,
    deleteDietType,
    getListDietTypes,
    findByIdDietType,
    getTotalDietTypes
}