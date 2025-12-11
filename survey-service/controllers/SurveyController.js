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
                message: "Lấy trạng thái onboarding thành công",
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
                message: "Lấy danh sách câu hỏi onboarding thành công",
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
                message: "Lấy danh sách user profiles thành công",
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
                message: "Lấy chi tiết user profile thành công",
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
                message: "Tạo câu hỏi khảo sát thành công",
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
                message: "Cập nhật câu hỏi khảo sát thành công",
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
                message: "Xóa câu hỏi khảo sát thành công"
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
                message: "Lấy danh sách tất cả câu hỏi khảo sát thành công",
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
                message: "Lấy danh sách câu hỏi khảo sát đang hoạt động thành công",
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
                message: "Lưu câu trả lời khảo sát thành công",
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
            const userId = req.user._id;
            const userResponse = await UserResponse.findOne({ userId });
            
            res.status(200).json({
                type: "GET_USER_RESPONSE",
                status: true,
                message: "Lấy câu trả lời khảo sát của người dùng thành công",
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

    updateUserResponse: async (req, res) => {
        try {
            const userId = req.user._id;
            const { responseId } = req.params;
            const { responses } = req.body;

            // Tìm response của user
            const userResponse = await UserResponse.findOne({ 
                _id: responseId,
                userId: userId 
            });

            if (!userResponse) {
                return res.status(404).json({
                    type: "UPDATE_USER_RESPONSE",
                    status: false,
                    message: "Không tìm thấy câu trả lời hoặc bạn không có quyền sửa câu trả lời này"
                });
            }

            // Cập nhật responses
            userResponse.responses = {
                ...userResponse.responses,
                ...responses
            };
            userResponse.updatedAt = Date.now();

            await userResponse.save();

            res.status(200).json({
                type: "UPDATE_USER_RESPONSE",
                status: true,
                message: "Cập nhật câu trả lời khảo sát thành công",
                data: userResponse
            });
        } catch (error) {
            res.status(500).json({
                type: "UPDATE_USER_RESPONSE",
                status: false,
                message: "Lỗi khi cập nhật câu trả lời",
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
                message: "Lấy thông tin chế độ ăn thành công",
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
    },

    // NUTRITION GOALS CALCULATOR
    calculateNutritionGoals: async (req, res) => {
        try {
            const userId = req.user._id;
            
            // Lấy user profile
            const userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                return res.status(404).json({
                    type: "CALCULATE_NUTRITION_GOALS",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng. Vui lòng hoàn thành onboarding trước."
                });
            }

            const { personalInfo, familyInfo, dietaryPreferences, isFamily } = userProfile;

            // Kiểm tra chế độ ăn
            if (!dietaryPreferences?.DietType_id) {
                return res.status(400).json({
                    type: "CALCULATE_NUTRITION_GOALS",
                    status: false,
                    message: "Thiếu thông tin chế độ ăn. Vui lòng cập nhật."
                });
            }

            let bmr, targetCalories;
            let calculationMethod;

            // ========== XỬ LÝ THEO LOẠI PROFILE ==========
            if (!isFamily) {
                // ===== CÁ NHÂN =====
                if (!personalInfo?.height || !personalInfo?.weight || !personalInfo?.age || !personalInfo?.gender) {
                    return res.status(400).json({
                        type: "CALCULATE_NUTRITION_GOALS",
                        status: false,
                        message: "Thiếu thông tin cá nhân (chiều cao, cân nặng, tuổi, giới tính). Vui lòng cập nhật."
                    });
                }

                // Tính BMR theo công thức Mifflin-St Jeor
                const { height, weight, age, gender } = personalInfo;
                
                if (gender === 'male') {
                    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
                } else if (gender === 'female') {
                    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
                } else {
                    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 78;
                }

                // Sử dụng BMR trực tiếp, không nhân với activity level
                targetCalories = Math.round(bmr);
                calculationMethod = "BMR (Mifflin-St Jeor)";

            } else {
                // ===== GIA ĐÌNH =====
                if (!familyInfo?.children && !familyInfo?.teenagers && !familyInfo?.adults && !familyInfo?.elderly) {
                    return res.status(400).json({
                        type: "CALCULATE_NUTRITION_GOALS",
                        status: false,
                        message: "Thiếu thông tin gia đình. Vui lòng cập nhật số lượng thành viên."
                    });
                }

                // Định mức calo cho từng nhóm tuổi
                const CALORIE_QUOTA = {
                    children: 1600,    // Trẻ em
                    teenagers: 2500,   // Thanh thiếu niên
                    adults: 2100,      // Người lớn
                    elderly: 1700      // Người cao tuổi
                };

                // Tính tổng calo gia đình
                const totalFamilyCalories = 
                    (familyInfo.children || 0) * CALORIE_QUOTA.children +
                    (familyInfo.teenagers || 0) * CALORIE_QUOTA.teenagers +
                    (familyInfo.adults || 0) * CALORIE_QUOTA.adults +
                    (familyInfo.elderly || 0) * CALORIE_QUOTA.elderly;

                targetCalories = totalFamilyCalories;
                bmr = null; // Không áp dụng BMR cho gia đình
                calculationMethod = "Tổng định mức calo gia đình";
            }

            // ========== GỌI API LẤY DIET TYPE ==========
            const axios = require('axios');


            console.log("dietaryPreferences.DietType_id :", dietaryPreferences.DietType_id);

            const dietTypeUrl = process.env.PORT_MEAL_DIETTYPE_DETAIL_ID.replace(':keyword', dietaryPreferences.DietType_id);
            const token = req.headers.authorization;
            
            let dietTypeData;
            try {
                const response = await axios.get(dietTypeUrl, {
                    headers: {
                        'x-api-key': process.env.API_KEY,
                        ...(token && { 'Authorization': token })
                    }
                });

                dietTypeData = response.data.data;
            } catch (error) {
                console.error('Error fetching diet type:', error.message);
                return res.status(400).json({
                    type: "CALCULATE_NUTRITION_GOALS",
                    status: false,
                    message: "Không thể lấy thông tin chế độ ăn. Vui lòng kiểm tra lại DietType_id."
                });
            }

            // Lấy nutrition từ diet type
            const { nutrition } = dietTypeData;
            if (!nutrition || !nutrition.calories) {
                return res.status(400).json({
                    type: "CALCULATE_NUTRITION_GOALS",
                    status: false,
                    message: "Chế độ ăn không có thông tin dinh dưỡng."
                });
            }

            // ========== TÍNH TỶ LỆ % TỪ GRAMS ==========
            // Protein & Carbs: 1g = 4 kcal, Fat: 1g = 9 kcal
            const proteinCalories = nutrition.protein * 4;
            const carbCalories = nutrition.carbs * 4;
            const fatCalories = nutrition.fat * 9;
            const dietTypeCalories = nutrition.calories;

            const proteinPercentage = Math.round((proteinCalories / dietTypeCalories) * 100);
            const carbPercentage = Math.round((carbCalories / dietTypeCalories) * 100);
            const fatPercentage = Math.round((fatCalories / dietTypeCalories) * 100);

            // ========== TÍNH GRAMS THỰC TẾ CHO TARGET CALORIES ==========
            const actualCarbGrams = Math.round((targetCalories * carbPercentage / 100) / 4);
            const actualProteinGrams = Math.round((targetCalories * proteinPercentage / 100) / 4);
            const actualFatGrams = Math.round((targetCalories * fatPercentage / 100) / 9);

            // Tính lượng nước cần uống
            let waterIntakeGoal;
            if (!isFamily) {
                // Cá nhân: 35ml/kg cân nặng
                waterIntakeGoal = Math.round((personalInfo.weight * 35) / 1000 * 10) / 10;
            } else {
                // Gia đình: Ước tính dựa trên số người (2.5L/người trung bình)
                const totalMembers = 
                    (familyInfo.children || 0) + 
                    (familyInfo.teenagers || 0) + 
                    (familyInfo.adults || 0) + 
                    (familyInfo.elderly || 0);
                waterIntakeGoal = Math.round(totalMembers * 2.5 * 10) / 10;
            }

            // ========== CẬP NHẬT NUTRITION GOALS ==========
            userProfile.nutritionGoals = {
                caloriesPerDay: targetCalories,
                proteinPercentage: proteinPercentage,
                carbPercentage: carbPercentage,
                fatPercentage: fatPercentage,
                waterIntakeGoal: waterIntakeGoal
            };

            await userProfile.save();

            // ========== TẠO RESPONSE DATA ==========
            const responseData = {
                user_id: userId,
                profileType: isFamily ? 'family' : 'personal',
                dietType: {
                    _id: dietTypeData._id,
                    title: dietTypeData.title,
                    keyword: dietTypeData.keyword
                },
                calculations: {
                    method: calculationMethod,
                    targetCalories: targetCalories
                },
                nutritionGoals: {
                    caloriesPerDay: targetCalories,
                    proteinPercentage: proteinPercentage,
                    carbPercentage: carbPercentage,
                    fatPercentage: fatPercentage,
                    waterIntakeGoal: waterIntakeGoal
                },
                macroDetails: {
                    carbs: {
                        percentage: carbPercentage,
                        calories: Math.round(targetCalories * carbPercentage / 100),
                        grams: actualCarbGrams
                    },
                    protein: {
                        percentage: proteinPercentage,
                        calories: Math.round(targetCalories * proteinPercentage / 100),
                        grams: actualProteinGrams
                    },
                    fat: {
                        percentage: fatPercentage,
                        calories: Math.round(targetCalories * fatPercentage / 100),
                        grams: actualFatGrams
                    }
                },
                dietTypeInfo: {
                    description: dietTypeData.description,
                    researchSource: dietTypeData.researchSource
                }
            };

            // Thêm thông tin chi tiết theo loại profile
            if (!isFamily) {
                responseData.personalInfo = {
                    height: personalInfo.height,
                    weight: personalInfo.weight,
                    age: personalInfo.age,
                    gender: personalInfo.gender
                };
                responseData.calculations.bmr = Math.round(bmr);
                // Xóa activityLevel khỏi response
            } else {
                responseData.familyInfo = {
                    children: familyInfo.children || 0,
                    teenagers: familyInfo.teenagers || 0,
                    adults: familyInfo.adults || 0,
                    elderly: familyInfo.elderly || 0,
                    totalMembers: 
                        (familyInfo.children || 0) + 
                        (familyInfo.teenagers || 0) + 
                        (familyInfo.adults || 0) + 
                        (familyInfo.elderly || 0)
                };
                responseData.calculations.breakdown = {
                    children: `${familyInfo.children || 0} × 1,600 = ${(familyInfo.children || 0) * 1600} kcal`,
                    teenagers: `${familyInfo.teenagers || 0} × 2,500 = ${(familyInfo.teenagers || 0) * 2500} kcal`,
                    adults: `${familyInfo.adults || 0} × 2,100 = ${(familyInfo.adults || 0) * 2100} kcal`,
                    elderly: `${familyInfo.elderly || 0} × 1,700 = ${(familyInfo.elderly || 0) * 1700} kcal`
                };
            }

            res.status(200).json({
                type: "CALCULATE_NUTRITION_GOALS",
                status: true,
                message: isFamily 
                    ? "Tính toán mục tiêu dinh dưỡng cho gia đình thành công" 
                    : "Tính toán mục tiêu dinh dưỡng cá nhân thành công",
                data: responseData
            });
        } catch (error) {
            console.error('Error in calculateNutritionGoals:', error);
            res.status(500).json({
                type: "CALCULATE_NUTRITION_GOALS",
                status: false,
                message: "Lỗi khi tính toán mục tiêu dinh dưỡng",
                error: error.message
            });
        }
    },

    // Cập nhật manual nutrition goals (nếu user muốn tự điều chỉnh)
    updateNutritionGoals: async (req, res) => {
        try {
            const userId = req.user._id;
            const { caloriesPerDay, proteinPercentage, carbPercentage, fatPercentage, waterIntakeGoal } = req.body;

            // Validate tổng % phải = 100
            if (proteinPercentage && carbPercentage && fatPercentage) {
                const totalPercentage = proteinPercentage + carbPercentage + fatPercentage;
                if (totalPercentage !== 100) {
                    return res.status(400).json({
                        type: "UPDATE_NUTRITION_GOALS",
                        status: false,
                        message: `Tổng phần trăm macro phải bằng 100. Hiện tại: ${totalPercentage}%`
                    });
                }
            }

            const userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                return res.status(404).json({
                    type: "UPDATE_NUTRITION_GOALS",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng"
                });
            }

            // Cập nhật từng field nếu có
            if (caloriesPerDay) userProfile.nutritionGoals.caloriesPerDay = caloriesPerDay;
            if (proteinPercentage) userProfile.nutritionGoals.proteinPercentage = proteinPercentage;
            if (carbPercentage) userProfile.nutritionGoals.carbPercentage = carbPercentage;
            if (fatPercentage) userProfile.nutritionGoals.fatPercentage = fatPercentage;
            if (waterIntakeGoal) userProfile.nutritionGoals.waterIntakeGoal = waterIntakeGoal;

            await userProfile.save();

            res.status(200).json({
                type: "UPDATE_NUTRITION_GOALS",
                status: true,
                message: "Cập nhật mục tiêu dinh dưỡng thành công",
                data: {
                    user_id: userId,
                    nutritionGoals: userProfile.nutritionGoals
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "UPDATE_NUTRITION_GOALS",
                status: false,
                message: "Lỗi khi cập nhật mục tiêu dinh dưỡng",
                error: error.message
            });
        }
    },

    // Lấy nutrition goals hiện tại
    getNutritionGoals: async (req, res) => {
        try {
            const userId = req.user._id;

            const userProfile = await UserProfile.findOne({ user_id: userId });
            if (!userProfile) {
                return res.status(404).json({
                    type: "GET_NUTRITION_GOALS",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng"
                });
            }

            res.status(200).json({
                type: "GET_NUTRITION_GOALS",
                status: true,
                message: "Lấy mục tiêu dinh dưỡng thành công",
                data: {
                    user_id: userId,
                    nutritionGoals: userProfile.nutritionGoals,
                    hasGoals: !!(userProfile.nutritionGoals?.caloriesPerDay)
                }
            });
        } catch (error) {
            res.status(500).json({
                type: "GET_NUTRITION_GOALS",
                status: false,
                message: "Lỗi khi lấy mục tiêu dinh dưỡng",
                error: error.message
            });
        }
    },

    // Lấy toàn bộ thông tin profile của user (bao gồm cả soft questions)
    getUserFullProfile: async (req, res) => {
        try {
            const userId = req.user._id;

            // Lấy user profile (hard questions - onboarding) - KHÔNG POPULATE
            const userProfile = await UserProfile.findOne({ user_id: userId });

            if (!userProfile) {
                return res.status(404).json({
                    type: "GET_USER_FULL_PROFILE",
                    status: false,
                    message: "Không tìm thấy thông tin người dùng"
                });
            }

            // Lấy user responses (soft questions - survey)
            const userResponse = await UserResponse.findOne({ userId });

            // Tổng hợp toàn bộ thông tin
            const fullProfile = {
                _id: userProfile._id,
                user_id: userProfile.user_id,
                isOnboardingCompleted: userProfile.isOnboardingCompleted,
                isFamily: userProfile.isFamily,
                
                // Thông tin cá nhân
                personalInfo: userProfile.personalInfo,
                
                // Thông tin gia đình
                familyInfo: userProfile.familyInfo,
                
                // Sở thích ăn uống
                dietaryPreferences: userProfile.dietaryPreferences,
                
                // Mục tiêu dinh dưỡng
                nutritionGoals: userProfile.nutritionGoals,
                
                // Nhắc nhở uống nước
                waterReminders: userProfile.waterReminders,
                
                // Câu hỏi mềm (survey responses)
                surveyResponses: userResponse ? userResponse.responses : null,
                
                // Soft questions từ userProfile
                softQuestions: userProfile.softQuestions,
                
                // Metadata
                createdAt: userProfile.createdAt,
                updatedAt: userProfile.updatedAt
            };

            res.status(200).json({
                type: "GET_USER_FULL_PROFILE",
                status: true,
                message: "Lấy thông tin profile đầy đủ thành công",
                data: fullProfile
            });
        } catch (error) {
            console.error('Error getting user full profile:', error);
            res.status(500).json({
                type: "GET_USER_FULL_PROFILE",
                status: false,
                message: "Lỗi khi lấy thông tin profile",
                error: error.message
            });
        }
    },
};

module.exports = surveyController;
