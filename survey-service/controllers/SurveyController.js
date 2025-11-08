const { Survey, UserResponse, UserProfile } = require('../models/SurveyModel');

const surveyController = {
    // USER PROFILE CONTROLLERS (Câu hỏi cứng)
    checkOnboardingStatus: async (req, res) => {
        try {
            const userId = req.user.id;
            let userProfile = await UserProfile.findOne({ user_id: userId });
            
            if (!userProfile) {
                userProfile = new UserProfile({
                    user_id: userId,
                    isOnboardingCompleted: false
                });
                await userProfile.save();
            }

            res.status(200).json({
                type: "CHECK_ONBOARDING_STATUS",
                status: true,
                message: "Truy vấn thành công",
                data: {
                    _id: userProfile._id,
                    user_id: userProfile.user_id,
                    isOnboardingCompleted: userProfile.isOnboardingCompleted,
                    isFamily: userProfile.isFamily,
                    personalInfo: userProfile.personalInfo,
                    familyInfo: userProfile.familyInfo,
                    dietaryPreferences: userProfile.dietaryPreferences,
                    nutritionGoals: userProfile.nutritionGoals,
                    waterReminders: userProfile.waterReminders,
                    softQuestions: userProfile.softQuestions
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "CHECK_ONBOARDING_STATUS",
                status: false,
                message: "Lỗi khi kiểm tra trạng thái onboarding",
                error: error.message
            });
        }
    },

    getOnboardingQuestions: async (req, res) => {
        try {
            const { profileType } = req.query; // 'personal' hoặc 'family'
            
            let questions = {
                common: {
                    dietaryPreferences: {
                        DietType_id: "enum",
                        allergies: "array",
                        dislikeIngredients: "array"
                    },
                    nutritionGoals: {
                        caloriesPerDay: "number",
                        proteinPercentage: "number", 
                        carbPercentage: "number",
                        fatPercentage: "number",
                        waterIntakeGoal: "number"
                    },
                    waterReminders: {
                        enabled: "boolean",
                        frequency: "number",
                        startTime: "string",
                        endTime: "string"
                    }
                }
            };

            if (profileType === 'personal') {
                questions.specific = {
                    personalInfo: {
                        height: "number (cm)",
                        weight: "number (kg)", 
                        age: "number",
                        gender: "enum"
                    }
                };
            } else if (profileType === 'family') {
                questions.specific = {
                    familyInfo: {
                        children: "number",
                        teenagers: "number",
                        adults: "number",
                        elderly: "number"
                    }
                };
            }

            res.status(200).json({
                type: "GET_ONBOARDING_QUESTIONS",
                status: true,
                message: "Truy vấn thành công",
                data: questions
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_ONBOARDING_QUESTIONS",
                status: false,
                message: "Lỗi khi lấy câu hỏi onboarding",
                error: error.message
            });
        }
    },

    saveOnboardingData: async (req, res) => {
        try {
            const userId = req.user.id;
            const { type, data } = req.body; // type: 'personal' hoặc 'family' hoặc 'common'
            
            let userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                userProfile = new UserProfile({ user_id: userId });
            }

            switch(type) {
                case 'personal':
                    userProfile.isFamily = false;
                    if (data.personalInfo) {
                        userProfile.personalInfo = { ...userProfile.personalInfo, ...data.personalInfo };
                    }
                    break;
                    
                case 'family':
                    userProfile.isFamily = true;
                    if (data.familyInfo) {
                        userProfile.familyInfo = { ...userProfile.familyInfo, ...data.familyInfo };
                    }
                    break;
                    
                case 'common':
                    if (data.dietaryPreferences) {
                        userProfile.dietaryPreferences = { ...userProfile.dietaryPreferences, ...data.dietaryPreferences };
                    }
                    if (data.nutritionGoals) {
                        userProfile.nutritionGoals = { ...userProfile.nutritionGoals, ...data.nutritionGoals };
                    }
                    if (data.waterReminders) {
                        userProfile.waterReminders = { ...userProfile.waterReminders, ...data.waterReminders };
                    }
                    break;
                    
                case 'complete':
                    userProfile.isOnboardingCompleted = true;
                    break;
            }

            await userProfile.save();

            res.status(200).json({
                type: "SAVE_ONBOARDING_DATA",
                status: true,
                message: "Lưu dữ liệu onboarding thành công",
                data: userProfile
            });
        } catch (error) {
            res.status(500).json({
                type: "SAVE_ONBOARDING_DATA",
                status: false,
                message: "Lỗi khi lưu dữ liệu onboarding",
                error: error.message
            });
        }
    },

    // ADMIN CONTROLLERS (Câu hỏi mềm)
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

    // USER CONTROLLERS (Câu hỏi mềm)  
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
