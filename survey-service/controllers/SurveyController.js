const { Survey, UserResponse, UserProfile } = require('../models/SurveyModel');

const surveyController = {
    // USER PROFILE CONTROLLERS (Câu hỏi cứng)
    checkOnboardingStatus: async (req, res) => {
        try {
            const userId = req.user._id;
            let userProfile = await UserProfile.findOne({ user_id: userId });
            
            if (!userProfile) {
                // Chỉ cần tạo với user_id, các field khác sẽ được tự động tạo theo schema default
                userProfile = new UserProfile({
                    user_id: userId
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
            const userId = req.user._id;
            const { type, data } = req.body;
            
            let userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                // Tạo mới với schema defaults
                userProfile = new UserProfile({ user_id: userId });
            }

            // Validation helper functions
            const isValidPersonalInfo = (personalInfo) => {
                return personalInfo && 
                       personalInfo.height && 
                       personalInfo.weight && 
                       personalInfo.age && 
                       personalInfo.gender;
            };

            const isValidFamilyInfo = (familyInfo) => {
                return familyInfo && 
                       (familyInfo.children > 0 || 
                        familyInfo.teenagers > 0 || 
                        familyInfo.adults > 0 || 
                        familyInfo.elderly > 0);
            };

            const isValidDietaryPreferences = (dietaryPreferences) => {
                return dietaryPreferences && dietaryPreferences.DietType_id;
            };

            switch(type) {
                case 'personal':
                    userProfile.isFamily = false;
                    
                    // Cập nhật personalInfo
                    if (data.personalInfo) {
                        userProfile.personalInfo = { ...userProfile.personalInfo, ...data.personalInfo };
                    }
                    
                    // Cập nhật dietaryPreferences
                    if (data.dietaryPreferences) {
                        userProfile.dietaryPreferences = { ...userProfile.dietaryPreferences, ...data.dietaryPreferences };
                    }

                    // Validation và auto complete
                    if (isValidPersonalInfo(userProfile.personalInfo) && 
                        isValidDietaryPreferences(userProfile.dietaryPreferences)) {
                        userProfile.isOnboardingCompleted = true;
                    }
                    break;
                    
                case 'family':
                    userProfile.isFamily = true;
                    
                    // Cập nhật familyInfo
                    if (data.familyInfo) {
                        userProfile.familyInfo = { ...userProfile.familyInfo, ...data.familyInfo };
                    }
                    
                    // Cập nhật dietaryPreferences
                    if (data.dietaryPreferences) {
                        userProfile.dietaryPreferences = { ...userProfile.dietaryPreferences, ...data.dietaryPreferences };
                    }

                    // Validation và auto complete
                    if (isValidFamilyInfo(userProfile.familyInfo) && 
                        isValidDietaryPreferences(userProfile.dietaryPreferences)) {
                        userProfile.isOnboardingCompleted = true;
                    }
                    break;

                default:
                    return res.status(400).json({
                        type: "SAVE_ONBOARDING_DATA",
                        status: false,
                        message: "Type không hợp lệ. Chỉ chấp nhận 'personal' hoặc 'family'"
                    });
            }

            await userProfile.save();

            res.status(200).json({
                type: "SAVE_ONBOARDING_DATA",
                status: true,
                message: "Lưu dữ liệu onboarding thành công",
                data: {
                    ...userProfile.toObject(),
                    isAutoCompleted: userProfile.isOnboardingCompleted
                }
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

    // ADMIN ONBOARDING CONTROLLERS
    getAllUserProfiles: async (req, res) => {
        try {
            const { page = 1, limit = 10, isFamily, isCompleted } = req.query;
            
            let filter = {};
            if (isFamily !== undefined) {
                filter.isFamily = isFamily === 'true';
            }
            if (isCompleted !== undefined) {
                filter.isOnboardingCompleted = isCompleted === 'true';
            }

            const userProfiles = await UserProfile.find(filter)
                .populate('user_id', 'name email')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            const total = await UserProfile.countDocuments(filter);

            res.status(200).json({
                type: "GET_ALL_USER_PROFILES",
                status: true,
                message: "Truy vấn thành công",
                data: userProfiles,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_ALL_USER_PROFILES",
                status: false,
                message: "Lỗi khi lấy danh sách onboarding",
                error: error.message
            });
        }
    },

    getUserProfileDetail: async (req, res) => {
        try {
            const userProfile = await UserProfile.findById(req.params.id)
                .populate('user_id', 'name email phone avatar');

            if (!userProfile) {
                return res.status(404).json({
                    type: "GET_USER_PROFILE_DETAIL",
                    status: false,
                    message: "Không tìm thấy thông tin onboarding"
                });
            }

            res.status(200).json({
                type: "GET_USER_PROFILE_DETAIL",
                status: true,
                message: "Truy vấn thành công",
                data: userProfile
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_USER_PROFILE_DETAIL",
                status: false,
                message: "Lỗi khi lấy chi tiết onboarding",
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
            const userId = req.user._id; // Sửa lại để consistent
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
                message: "Lưu câu trả lời mềm thành công",
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
            const userId = req.user._id; // Sửa lại để consistent
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
    },

    // DIETARY PREFERENCES CONTROLLERS
    getDietaryPreferences: async (req, res) => {
        try {
            const userId = req.params.id;
            const currentUserId = req.user._id;

            // Kiểm tra quyền: chỉ user đó mới được xem chế độ ăn của chính mình
            if (userId !== currentUserId.toString()) {
                return res.status(403).json({
                    type: "GET_DIETARY_PREFERENCES",
                    status: false,
                    message: "Bạn chỉ có thể xem chế độ ăn của chính mình"
                });
            }

            const userProfile = await UserProfile.findOne({ user_id: userId });

            if (!userProfile) {
                return res.status(404).json({
                    type: "GET_DIETARY_PREFERENCES",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng"
                });
            }

            res.status(200).json({
                type: "GET_DIETARY_PREFERENCES",
                status: true,
                message: "Truy vấn thành công",
                data: {
                    user_id: userProfile.user_id,
                    dietaryPreferences: userProfile.dietaryPreferences
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_DIETARY_PREFERENCES",
                status: false,
                message: "Lỗi khi lấy thông tin chế độ ăn",
                error: error.message
            });
        }
    },

    updateDietaryPreferences: async (req, res) => {
        try {
            const userId = req.params.id;
            const currentUserId = req.user._id;
            const { DietType_id } = req.body;

            // Kiểm tra quyền: chỉ user đó mới được cập nhật chế độ ăn của chính mình
            if (userId !== currentUserId.toString()) {
                return res.status(403).json({
                    type: "UPDATE_DIETARY_PREFERENCES",
                    status: false,
                    message: "Bạn chỉ có thể cập nhật chế độ ăn của chính mình"
                });
            }

            const userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                return res.status(404).json({
                    type: "UPDATE_DIETARY_PREFERENCES",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng"
                });
            }

            // Cập nhật DietType_id
            userProfile.dietaryPreferences = {
                ...userProfile.dietaryPreferences,
                DietType_id: DietType_id
            };

            await userProfile.save();

            res.status(200).json({
                type: "UPDATE_DIETARY_PREFERENCES",
                status: true,
                message: "Cập nhật chế độ ăn thành công",
                data: {
                    user_id: userProfile.user_id,
                    dietaryPreferences: userProfile.dietaryPreferences
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "UPDATE_DIETARY_PREFERENCES",
                status: false,
                message: "Lỗi khi cập nhật chế độ ăn",
                error: error.message
            });
        }
    }
};

module.exports = surveyController;
