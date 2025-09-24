const mongoose = require("mongoose");
const DietTypeModel = require("../model/DietTypeModel");

// Thêm Loại chế độ ăn uống mới
const addDietType = async (req, res) => {
    try {
        const { keyword, title, dietTypeImage, description, descriptionDetail, researchSource } = req.body;
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

        const newDietType = new DietTypeModel({
            keyword: keyword.toLowerCase(),
            title,
            dietTypeImage,
            description,
            descriptionDetail,
            researchSource
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
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

// update loại chế độ ăn uống
const updateDietType = async (req, res) => {
    try {
        const { diet_type_id } = req.params;
        const { keyword, title, dietTypeImage, description, descriptionDetail, researchSource } = req.body;

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
        if (keyword) updateFields.keyword = keyword.toLowerCase();
        if (title) updateFields.title = title;
        if (dietTypeImage) updateFields.dietTypeImage = dietTypeImage;
        if (description) updateFields.description = description;
        if (descriptionDetail) updateFields.descriptionDetail = descriptionDetail;
        if (researchSource) updateFields.researchSource = researchSource;

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
            message: "Lỗi server, vui lòng thử lại sau!",
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
            message: "Lỗi server, vui lòng thử lại sau!",
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
            message: "Lỗi server, vui lòng thử lại sau!",
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
            message: "Lỗi server, vui lòng thử lại sau!",
            status: false,
            error: error.message
        });
    }
}

module.exports = {
    addDietType,
    updateDietType,
    deleteDietType,
    getListDietTypes,
    findByIdDietType
}