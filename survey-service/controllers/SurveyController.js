const { Survey, UserResponse } = require('../models/SurveyModel');

const surveyController = {
    // ADMIN CONTROLLERS
    createSurvey: async (req, res) => {
        try {
            const newSurvey = new Survey(req.body);
            const savedSurvey = await newSurvey.save();
            res.status(201).json({
                type: "CREATE_SURVEY",
                status: true,
                message: "Truy vấn thành công",
                data: savedSurvey
            });
        } catch (error) {
            res.status(500).json({
                type: "CREATE_SURVEY",
                status: false,
                message: "Lỗi khi tạo câu hỏi khảo sát",
                error: error.message
            });
        }
    },

    updateSurvey: async (req, res) => {
        try {
            const updatedSurvey = await Survey.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true }
            );
            res.status(200).json({
                type: "UPDATE_SURVEY",
                status: true,
                message: "Truy vấn thành công",
                data: updatedSurvey
            });
        } catch (error) {
            res.status(500).json({
                type: "UPDATE_SURVEY",
                status: false,
                message: "Lỗi khi cập nhật câu hỏi khảo sát",
                error: error.message
            });
        }
    },

    deleteSurvey: async (req, res) => {
        try {
            await Survey.findByIdAndDelete(req.params.id);
            res.status(200).json({
                type: "DELETE_SURVEY",
                status: true,
                message: "Truy vấn thành công"
            });
        } catch (error) {
            res.status(500).json({
                type: "DELETE_SURVEY",
                status: false,
                message: "Lỗi khi xóa câu hỏi khảo sát",
                error: error.message
            });
        }
    },

    getAllSurveysAdmin: async (req, res) => {
        try {
            const surveys = await Survey.find().sort('order'); // Lấy tất cả không quan tâm isActive
            res.status(200).json({
                type: "GET_ALL_SURVEYS_ADMIN",
                status: true,
                message: "Truy vấn thành công",
                data: surveys
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_ALL_SURVEYS_ADMIN",
                status: false,
                message: "Lỗi khi lấy danh sách khảo sát",
                error: error.message
            });
        }
    },

    // USER CONTROLLERS
    getAllSurveys: async (req, res) => {
        try {
            const surveys = await Survey.find({ isActive: true }).sort('order'); // Chỉ lấy các câu hỏi active
            res.status(200).json({
                type: "GET_ALL_SURVEYS",
                status: true,
                message: "Truy vấn thành công",
                data: surveys
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_ALL_SURVEYS",
                status: false,
                message: "Lỗi khi lấy danh sách khảo sát",
                error: error.message
            });
        }
    },

    submitUserResponse: async (req, res) => {
        try {
            const userId = req.user.id;
            let userResponse = await UserResponse.findOne({ userId });

            if (userResponse) {
                // Cập nhật response nếu đã tồn tại
                userResponse.responses = {
                    ...userResponse.responses,
                    ...req.body.responses
                };
                await userResponse.save();
            } else {
                // Tạo mới nếu chưa có
                userResponse = new UserResponse({
                    userId,
                    responses: req.body.responses
                });
                await userResponse.save();
            }

            res.status(200).json({
                type: "SUBMIT_SURVEY_RESPONSE",
                status: true,
                message: "Truy vấn thành công",
                data: userResponse
            });
        } catch (error) {
            res.status(500).json({
                type: "SUBMIT_SURVEY_RESPONSE",
                status: false,
                message: "Lỗi khi lưu câu trả lời",
                error: error.message
            });
        }
    },

    getUserResponse: async (req, res) => {
        try {
            const userId = req.user.id;
            const userResponse = await UserResponse.findOne({ userId });
            
            res.status(200).json({
                type: "GET_USER_RESPONSE",
                status: true,
                message: "Truy vấn thành công",
                data: userResponse
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_USER_RESPONSE",
                status: false,
                message: "Lỗi khi lấy câu trả lời của người dùng",
                error: error.message
            });
        }
    }
};

module.exports = surveyController;
