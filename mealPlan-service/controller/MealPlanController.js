const MealPlan = require('../models/MealPlanModel');
const MealPlanHistory = require('../models/MealPlanHistoryModel');
const { generateSimpleMealPlan } = require('../utils/genAIUtils');
const {
    saveMealPlanToRedis,
    getMealPlanFromRedis,
    deleteMealPlanFromRedis
} = require('../utils/redisUtils');
const {
    getAllMeals,
    getMultipleMealsWithDetails,
    getUserFullProfile,
    getIngredientCategories,
    getAllMealCategories,
    getMealsByCategoryWithLimit,
    getMealDetailById // Import function mới
} = require('../utils/apiUtils');
const {
    analyzeDietaryNeedsWithAI,
    selectMealsWithAI,
    selectSimilarMealsWithAI
} = require('../utils/genAIUtils');

// Lấy tất cả món ăn từ Meal Service với token
const fetchAllMeals = async (token) => {
    try {
        const meals = await getAllMeals(token);
        return meals;
    } catch (error) {
        console.error('Error fetching meals:', error);
        throw new Error('Không thể tải danh sách món ăn');
    }
};

// Tạo thực đơn đơn giản (random meals)
const generateMealPlan = async (req, res) => {
    try {
        const { date, forFamily = false } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date) {
            return res.status(400).json({ error: 'Ngày không được để trống' });
        }

        // Kiểm tra cache Redis trước
        const cached = await getMealPlanFromRedis(redis, userId, date);
        if (cached && !cached.generatedByAI) {
            return res.json({ success: true, data: cached, fromCache: true });
        }

        // Lấy danh sách món ăn với token
        const allMeals = await fetchAllMeals(token);
        
        if (!allMeals?.data?.meals || allMeals.data.meals.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn nào' });
        }

        // Tạo thực đơn đơn giản
        const simpleMealPlan = generateSimpleMealPlan(allMeals, forFamily);

        // Tạo cấu trúc meal plan với chi tiết đầy đủ
        const mealPlan = [];
        for (const [servingTime, meals] of Object.entries(simpleMealPlan)) {
            // Lấy chi tiết đầy đủ của các món ăn
            const mealsToGet = meals.map(meal => 
                allMeals.data.meals.find(m => m._id === meal.meal_id)
            ).filter(Boolean);
            
            const detailedMeals = await getMultipleMealsWithDetails(mealsToGet, token);
            
            mealPlan.push({
                servingTime,
                meals: meals.map((meal, index) => ({
                    meal_id: meal.meal_id,
                    isEaten: false,
                    portionSize: meal.portionSize,
                    mealDetail: detailedMeals[index] || null
                }))
            });
        }

        const newMealPlan = {
            user_id: userId,
            date: new Date(date),
            mealPlan,
            forFamily,
            generatedByAI: false
        };

        // Lưu vào Redis
        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        res.json({ success: true, data: newMealPlan, fromCache: false });
    } catch (error) {
        console.error('Error generating meal plan:', error);
        res.status(500).json({ error: 'Lỗi tạo thực đơn', details: error.message });
    }
};

// Đổi món trong thực đơn (CHỈ CẬP NHẬT REDIS, KHÔNG UPDATE DB)
const replaceMeal = async (req, res) => {
    try {
        const { date, servingTime, oldMealId, newMealId, portionSize } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date || !servingTime || !oldMealId || !newMealId) {
            return res.status(400).json({ 
                type: "REPLACE_MEAL",
                status: false,
                error: 'Thiếu thông tin bắt buộc (date, servingTime, oldMealId, newMealId)' 
            });
        }

        console.log('🔄 Đổi món trong thực đơn...');
        console.log(`📅 Date: ${date}, Bữa: ${servingTime}`);
        console.log(`🔀 Đổi từ ${oldMealId} → ${newMealId}`);

        // ============= BƯỚC 1: LẤY MEAL PLAN TỪ REDIS =============
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({ 
                type: "REPLACE_MEAL",
                status: false,
                error: 'Không tìm thấy thực đơn trong cache. Vui lòng tạo thực đơn trước.' 
            });
        }

        // ============= BƯỚC 2: TÌM BỮA ĂN CẦN ĐỔI =============
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({ 
                type: "REPLACE_MEAL",
                status: false,
                error: `Không tìm thấy bữa ${servingTime}` 
            });
        }

        // ============= BƯỚC 3: TÌM MÓN ĂN CŨ =============
        const mealIndex = mealSection.meals.findIndex(meal => meal.meal_id.toString() === oldMealId);
        if (mealIndex === -1) {
            return res.status(404).json({ 
                type: "REPLACE_MEAL",
                status: false,
                error: 'Không tìm thấy món ăn cũ trong thực đơn' 
            });
        }

        console.log(`✓ Tìm thấy món cũ tại index ${mealIndex}`);

        // ============= BƯỚC 4: LẤY CHI TIẾT MÓN MỚI =============
        const allMeals = await fetchAllMeals(token);
        const newMealData = allMeals.data.meals.find(m => m._id === newMealId);
        
        if (!newMealData) {
            return res.status(404).json({ 
                type: "REPLACE_MEAL",
                status: false,
                error: 'Không tìm thấy món ăn mới trong hệ thống' 
            });
        }

        console.log(`✓ Tìm thấy món mới: ${newMealData.nameMeal}`);

        // Lấy chi tiết đầy đủ (recipe + ingredients)
        const detailedMeals = await getMultipleMealsWithDetails([newMealData], token);
        const newMealDetail = detailedMeals[0];

        // ============= BƯỚC 5: THAY THẾ MÓN ĂN TRONG MEAL PLAN =============
        mealSection.meals[mealIndex] = {
            meal_id: newMealId,
            isEaten: false, // Reset trạng thái
            portionSize: portionSize || mealSection.meals[mealIndex].portionSize || { 
                amount: mealPlan.forFamily ? 4 : 1, 
                unit: "portion" 
            },
            mealDetail: newMealDetail
        };

        console.log(`✓ Đã thay thế món tại index ${mealIndex}`);

        // ============= BƯỚC 6: CẬP NHẬT LẠI REDIS (KHÔNG UPDATE DB) =============
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        console.log('✅ Cập nhật Redis cache thành công');
        console.log('⚠️  Lưu ý: Thay đổi chỉ có trong cache, chưa lưu vào database');
        console.log('💡 Gọi API /save để lưu vĩnh viễn vào database');

        res.json({ 
            type: "REPLACE_MEAL",
            status: true,
            success: true, 
            data: mealPlan, 
            message: '✅ Đổi món thành công! Nhớ gọi API /save để lưu vào database.',
            note: 'Thay đổi hiện chỉ có trong Redis cache (TTL: 24h)'
        });
    } catch (error) {
        console.error('❌ Error replacing meal:', error);
        res.status(500).json({ 
            type: "REPLACE_MEAL",
            status: false,
            error: 'Lỗi đổi món', 
            details: error.message 
        });
    }
};

// Xóa món khỏi thực đơn
const removeMeal = async (req, res) => {
    try {
        const { date, servingTime, mealId } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        if (!date || !servingTime || !mealId) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Lấy meal plan từ Redis
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
        }

        // Tìm và xóa món
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({ error: 'Không tìm thấy bữa ăn' });
        }

        const originalLength = mealSection.meals.length;
        mealSection.meals = mealSection.meals.filter(meal => meal.meal_id.toString() !== mealId);

        if (mealSection.meals.length === originalLength) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn để xóa' });
        }

        // Cập nhật Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        res.json({ success: true, data: mealPlan, message: 'Xóa món thành công' });
    } catch (error) {
        console.error('Error removing meal:', error);
        res.status(500).json({ error: 'Lỗi xóa món', details: error.message });
    }
};

// Lưu thực đơn vào database
const saveMealPlan = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        if (!date) {
            return res.status(400).json({ 
                type: "SAVE_MEAL_PLAN",
                status: false,
                error: 'Ngày không được để trống' 
            });
        }

        // Lấy meal plan từ Redis
        const mealPlanData = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlanData) {
            return res.status(404).json({ 
                type: "SAVE_MEAL_PLAN",
                status: false,
                error: 'Không tìm thấy thực đơn trong cache' 
            });
        }

        // Chuẩn bị data để lưu vào DB (không lưu mealDetail)
        const dataToSave = {
            ...mealPlanData,
            mealPlan: mealPlanData.mealPlan.map(section => ({
                ...section,
                meals: section.meals.map(meal => ({
                    meal_id: meal.meal_id,
                    isEaten: meal.isEaten,
                    portionSize: meal.portionSize
                    // Không lưu mealDetail vào DB
                }))
            }))
        };

        // Kiểm tra xem đã có meal plan cho ngày này chưa
        let savedMealPlan = await MealPlan.findOne({ 
            user_id: userId, 
            date: new Date(date) 
        });

        if (savedMealPlan) {
            // Cập nhật meal plan hiện có
            savedMealPlan = await MealPlan.findOneAndUpdate(
                { user_id: userId, date: new Date(date) },
                { 
                    $set: {
                        mealPlan: dataToSave.mealPlan,
                        forFamily: dataToSave.forFamily,
                        generatedByAI: dataToSave.generatedByAI,
                        aiMetadata: dataToSave.aiMetadata,
                        updatedAt: new Date()
                    }
                },
                { new: true } // Trả về document sau khi update
            );

            return res.json({ 
                type: "SAVE_MEAL_PLAN",
                status: true,
                success: true, 
                message: 'Cập nhật thực đơn thành công',
                data: savedMealPlan
            });
        } else {
            // Tạo meal plan mới
            const newMealPlan = new MealPlan(dataToSave);
            savedMealPlan = await newMealPlan.save();

            return res.json({ 
                type: "SAVE_MEAL_PLAN",
                status: true,
                success: true, 
                message: 'Lưu thực đơn mới thành công',
                data: savedMealPlan
            });
        }
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ 
            type: "SAVE_MEAL_PLAN",
            status: false,
            error: 'Lỗi lưu thực đơn', 
            details: error.message 
        });
    }
};

// // Lấy thực đơn
// const getMealPlan = async (req, res) => {
//     try {
//         const { date } = req.body;
//         const userId = req.user_id;
//         const redis = req.app.locals.redis;

//         if (!date) {
//             return res.status(400).json({ 
//                 type: "GET_MEAL_PLAN",
//                 status: false,
//                 error: 'Ngày không được để trống' 
//             });
//         }

//         // Kiểm tra Redis trước
//         let mealPlan = await getMealPlanFromRedis(redis, userId, date);
//         let fromCache = true;
        
//         if (!mealPlan) {
//             // Nếu không có trong Redis, tìm trong database
//             mealPlan = await MealPlan.findOne({ 
//                 user_id: userId, 
//                 date: new Date(date) 
//             });

//             if (mealPlan) {
//                 // Lưu lại vào Redis
//                 await saveMealPlanToRedis(redis, userId, date, mealPlan);
//                 fromCache = false;
//             }
//         }

//         // Nếu không tìm thấy, trả về structure rỗng thay vì 404
//         if (!mealPlan) {
//             return res.json({
//                 type: "GET_MEAL_PLAN",
//                 status: true,
//                 success: true,
//                 data: {
//                     user_id: userId,
//                     date: new Date(date),
//                     mealPlan: [],
//                     forFamily: false,
//                     generatedByAI: false
//                 },
//                 fromCache: false,
//                 message: 'Chưa có thực đơn cho ngày này'
//             });
//         }

//         res.json({ 
//             type: "GET_MEAL_PLAN",
//             status: true,
//             success: true, 
//             data: mealPlan, 
//             fromCache,
//             message: fromCache ? 'Lấy thực đơn từ cache' : 'Lấy thực đơn từ database'
//         });
//     } catch (error) {
//         console.error('Error getting meal plan:', error);
//         res.status(500).json({ 
//             type: "GET_MEAL_PLAN",
//             status: false,
//             error: 'Lỗi lấy thực đơn', 
//             details: error.message 
//         });
//     }
// };

// Lấy thực đơn từ Redis (cache) - nhanh
const getMealPlanFromCache = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        if (!date) {
            return res.status(400).json({ 
                type: "GET_MEAL_PLAN_FROM_CACHE",
                status: false,
                error: 'Ngày không được để trống' 
            });
        }

        // CHỈ lấy từ Redis, không fallback sang DB
        const mealPlan = await getMealPlanFromRedis(redis, userId, date);
        
        if (!mealPlan) {
            return res.json({
                type: "GET_MEAL_PLAN_FROM_CACHE",
                status: true,
                success: true,
                data: {
                    user_id: userId,
                    date: new Date(date),
                    mealPlan: [],
                    forFamily: false,
                    generatedByAI: false
                },
                fromCache: false,
                message: 'Chưa có thực đơn trong cache cho ngày này'
            });
        }

        res.json({ 
            type: "GET_MEAL_PLAN_FROM_CACHE",
            status: true,
            success: true, 
            data: mealPlan, 
            fromCache: true,
            message: 'Lấy thực đơn từ Redis cache thành công'
        });
    } catch (error) {
        console.error('Error getting meal plan from cache:', error);
        res.status(500).json({ 
            type: "GET_MEAL_PLAN_FROM_CACHE",
            status: false,
            error: 'Lỗi lấy thực đơn từ cache', 
            details: error.message 
        });
    }
};

// Lấy thực đơn từ Database - chính xác
const getMealPlanFromDatabase = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date) {
            return res.status(400).json({ 
                type: "GET_MEAL_PLAN_FROM_DATABASE",
                status: false,
                error: 'Ngày không được để trống' 
            });
        }

        // CHỈ lấy từ Database
        let mealPlan = await MealPlan.findOne({ 
            user_id: userId, 
            date: new Date(date) 
        });

        if (!mealPlan) {
            return res.json({
                type: "GET_MEAL_PLAN_FROM_DATABASE",
                status: true,
                success: true,
                data: {
                    user_id: userId,
                    date: new Date(date),
                    mealPlan: [],
                    forFamily: false,
                    generatedByAI: false
                },
                fromDatabase: true,
                message: 'Chưa có thực đơn trong database cho ngày này'
            });
        }

        // Lấy chi tiết đầy đủ của các món ăn từ meal service
        const enrichedMealPlan = { ...mealPlan.toObject() };
        
        for (const section of enrichedMealPlan.mealPlan) {
            const mealsWithDetails = [];
            
            for (const meal of section.meals) {
                // Lấy thông tin meal từ meal service
                const allMeals = await fetchAllMeals(token);
                const mealData = allMeals.data?.meals?.find(m => m._id === meal.meal_id.toString());
                
                if (mealData) {
                    const detailedMeals = await getMultipleMealsWithDetails([mealData], token);
                    mealsWithDetails.push({
                        ...meal,
                        mealDetail: detailedMeals[0] || null
                    });
                } else {
                    mealsWithDetails.push({
                        ...meal,
                        mealDetail: null
                    });
                }
            }
            
            section.meals = mealsWithDetails;
        }

        // Sync lại vào Redis để cache
        await saveMealPlanToRedis(redis, userId, date, enrichedMealPlan);

        res.json({ 
            type: "GET_MEAL_PLAN_FROM_DATABASE",
            status: true,
            success: true, 
            data: enrichedMealPlan, 
            fromDatabase: true,
            syncedToCache: true,
            message: 'Lấy thực đơn từ database và đồng bộ vào cache thành công'
        });
    } catch (error) {
        console.error('Error getting meal plan from database:', error);
        res.status(500).json({ 
            type: "GET_MEAL_PLAN_FROM_DATABASE",
            status: false,
            error: 'Lỗi lấy thực đơn từ database', 
            details: error.message 
        });
    }
};

// Gợi ý món ăn tương tự bằng AI
const getSimilarMeals = async (req, res) => {
    try {
        const { mealId } = req.params;
        const userId = req.user_id;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!mealId) {
            return res.status(400).json({ 
                type: "GET_SIMILAR_MEALS",
                status: false,
                error: 'Meal ID không được để trống' 
            });
        }

        console.log('=== Tìm món tương tự bằng AI ===');
        console.log(`🔍 Meal ID: ${mealId}`);

        // Lấy danh sách tất cả món ăn
        const allMeals = await fetchAllMeals(token);
        
        if (!allMeals?.data?.meals || allMeals.data.meals.length === 0) {
            return res.status(404).json({ 
                type: "GET_SIMILAR_MEALS",
                status: false,
                error: 'Không tìm thấy món ăn nào' 
            });
        }

        // Tìm món ăn hiện tại
        const currentMeal = allMeals.data.meals.find(meal => meal._id === mealId);
        if (!currentMeal) {
            return res.status(404).json({ 
                type: "GET_SIMILAR_MEALS",
                status: false,
                error: 'Không tìm thấy món ăn' 
            });
        }

        console.log(`✓ Món hiện tại: ${currentMeal.nameMeal}`);

        // Lọc các món ăn khác (loại bỏ món hiện tại)
        const otherMeals = allMeals.data.meals.filter(meal => meal._id !== mealId);
        
        // Lấy user profile (optional, để AI có thêm context)
        let userProfile = null;
        try {
            const userProfileResponse = await getUserFullProfile(token);
            if (userProfileResponse.status) {
                userProfile = userProfileResponse.data;
            }
        } catch (error) {
            console.log('⚠ Không lấy được user profile, tiếp tục với AI không có context');
        }

        console.log('🤖 AI đang phân tích và chọn món tương tự...');

        // AI chọn 2 món tương tự
        const aiSelectedMeals = await selectSimilarMealsWithAI({
            currentMeal,
            allMeals: otherMeals,
            userProfile
        });

        console.log(`✓ AI chọn được ${aiSelectedMeals.length} món`);

        // Lấy chi tiết đầy đủ của các món tương tự
        const similarMealsData = [];
        for (const selected of aiSelectedMeals) {
            const mealData = otherMeals.find(m => m._id === selected.meal_id);
            if (mealData) {
                similarMealsData.push(mealData);
            }
        }

        const detailedSimilarMeals = await getMultipleMealsWithDetails(similarMealsData, token);

        // Thêm reason từ AI vào response
        const enrichedSimilarMeals = detailedSimilarMeals.map((meal, index) => ({
            ...meal,
            aiReason: aiSelectedMeals[index]?.reason || 'Món tương tự được AI đề xuất'
        }));

        console.log('=== Hoàn thành: Tìm món tương tự bằng AI ===');

        res.json({
            type: "GET_SIMILAR_MEALS",
            status: true,
            success: true,
            data: {
                currentMeal: {
                    _id: currentMeal._id,
                    nameMeal: currentMeal.nameMeal,
                    description: currentMeal.description,
                    mealCategory: currentMeal.mealCategory,
                    mealImage: currentMeal.mealImage
                },
                similarMeals: enrichedSimilarMeals,
                total: enrichedSimilarMeals.length
            },
            message: '🤖 AI đã chọn 2 món tương tự phù hợp nhất!',
            note: 'Mỗi lần gọi API, AI có thể gợi ý món khác nhau dựa trên phân tích dinh dưỡng và độ tương đồng.'
        });

    } catch (error) {
        console.error('=== LỖI: Tìm món tương tự thất bại ===');
        console.error(error);
        res.status(500).json({ 
            type: "GET_SIMILAR_MEALS",
            status: false,
            error: 'Lỗi lấy món tương tự', 
            details: error.message 
        });
    }
};

// Tạo thực đơn bằng AI dựa trên user profile
const generateAIMealPlanController = async (req, res) => {
    try {
        const { date, forFamily = false } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date) {
            return res.status(400).json({ error: 'Ngày không được để trống' });
        }

        // ============= XÓA CACHE CŨ TRƯỚC KHI GENERATE MỚI =============
        console.log('🗑️  Xóa meal plan cũ trong Redis (nếu có)...');
        await deleteMealPlanFromRedis(redis, userId, date);
        
        // Không check cache nữa, mỗi lần gọi API sẽ generate mới
        // Loại bỏ phần check cached

        console.log('=== BƯỚC 1: Lấy thông tin user profile ===');
        const userProfileResponse = await getUserFullProfile(token);
        if (!userProfileResponse.status) {
            return res.status(404).json({ 
                error: 'Không tìm thấy thông tin người dùng. Vui lòng hoàn thành khảo sát và tính toán nutrition goals trước.' 
            });
        }
        const userProfile = userProfileResponse.data;
        console.log('✓ User Profile:', {
            isFamily: userProfile.isFamily,
            calories: userProfile.nutritionGoals?.caloriesPerDay,
            dietType: userProfile.dietaryPreferences?.DietType_id
        });

        // Validate nutrition goals
        if (!userProfile.nutritionGoals?.caloriesPerDay) {
            return res.status(400).json({
                error: 'Chưa có mục tiêu dinh dưỡng. Vui lòng gọi API /nutrition-goals/calculate trước.'
            });
        }

        console.log('=== BƯỚC 2: Lấy danh mục nguyên liệu ===');
        const ingredientCategoriesResponse = await getIngredientCategories(token);
        const ingredientCategories = ingredientCategoriesResponse.data?.ingredientCategories || [];
        console.log(`✓ Lấy được ${ingredientCategories.length} danh mục nguyên liệu`);

        console.log('=== BƯỚC 3: Lấy danh mục món ăn ===');
        const mealCategoriesResponse = await getAllMealCategories(token);
        
        // FIX: Extract mảng từ response structure
        let mealCategories = [];
        if (Array.isArray(mealCategoriesResponse.data)) {
            mealCategories = mealCategoriesResponse.data;
        } else if (mealCategoriesResponse.data?.mealCategories) {
            mealCategories = mealCategoriesResponse.data.mealCategories;
        } else if (mealCategoriesResponse.data?.data) {
            mealCategories = mealCategoriesResponse.data.data;
        } else {
            console.error('Unexpected meal categories structure:', mealCategoriesResponse);
            return res.status(500).json({
                error: 'Lỗi lấy danh mục món ăn. Structure không đúng format.'
            });
        }
        
        console.log(`✓ Lấy được ${mealCategories.length} danh mục món ăn`);

        if (!Array.isArray(mealCategories) || mealCategories.length === 0) {
            return res.status(500).json({
                error: 'Không có danh mục món ăn nào. Vui lòng kiểm tra Meal Service.'
            });
        }

        console.log('=== BƯỚC 4: AI phân tích và chọn danh mục phù hợp ===');
        const categoryRecommendations = await analyzeDietaryNeedsWithAI({
            userProfile,
            ingredientCategories,
            mealCategories
        });
        console.log('✓ AI gợi ý danh mục:', categoryRecommendations);

        console.log('=== BƯỚC 5: Lấy món ăn từ các danh mục được chọn ===');
        const mealsByServingTime = {};
        const targetCalories = userProfile.nutritionGoals.caloriesPerDay;
        const portionAmount = userProfile.isFamily 
            ? (userProfile.familyInfo?.children || 0) + (userProfile.familyInfo?.teenagers || 0) + (userProfile.familyInfo?.adults || 0) + (userProfile.familyInfo?.elderly || 0) || 2
            : 1;

        for (const servingTime of ['breakfast', 'lunch', 'dinner']) {
            const categoryIds = categoryRecommendations[servingTime] || [];
            const allMealsForTime = [];

            for (const categoryId of categoryIds) {
                const mealsResponse = await getMealsByCategoryWithLimit(categoryId, token, 200);
                const meals = mealsResponse.data?.meals || [];
                allMealsForTime.push(...meals);
            }

            console.log(`✓ ${servingTime}: Lấy được ${allMealsForTime.length} món`);

            if (allMealsForTime.length === 0) {
                console.warn(`⚠ Không có món cho ${servingTime}, chuyển sang fallback`);
                continue;
            }

            // Lọc món ăn (loại bỏ dị ứng & không thích)
            const filteredMeals = allMealsForTime.filter(meal => {
                const allergies = userProfile.dietaryPreferences?.allergies || [];
                const dislikeIngredients = userProfile.dietaryPreferences?.dislikeIngredients || [];
                
                if (!meal.ingredients) return true;
                
                const hasAllergen = meal.ingredients.some(ing => 
                    allergies.includes(ing.ingredient_id) || allergies.includes(ing.name)
                );
                const hasDisliked = meal.ingredients.some(ing => 
                    dislikeIngredients.includes(ing.ingredient_id) || dislikeIngredients.includes(ing.name)
                );
                
                return !hasAllergen && !hasDisliked;
            });

            console.log(`✓ ${servingTime}: Còn ${filteredMeals.length} món sau khi lọc`);

            // AI chọn món cụ thể (mỗi lần gọi AI sẽ chọn món khác nhau nhờ random trong AI)
            const selectedMeals = await selectMealsWithAI({
                servingTime,
                meals: filteredMeals,
                userProfile,
                targetCalories
            });

            mealsByServingTime[servingTime] = selectedMeals.map(m => ({
                meal_id: m.meal_id,
                portionSize: {
                    amount: portionAmount,
                    unit: "portion"
                }
            }));
        }

        console.log('=== BƯỚC 6: Lấy chi tiết đầy đủ của các món đã chọn ===');
        const mealPlan = [];
        for (const [servingTime, selectedMeals] of Object.entries(mealsByServingTime)) {
            const mealsToGet = [];
            
            for (const mealItem of selectedMeals) {
                // Tìm meal details từ tất cả meals đã fetch
                for (const categoryId of categoryRecommendations[servingTime] || []) {
                    const mealsResponse = await getMealsByCategoryWithLimit(categoryId, token, 200);
                    const foundMeal = mealsResponse.data?.meals?.find(m => m._id === mealItem.meal_id);
                    if (foundMeal) {
                        mealsToGet.push(foundMeal);
                        break;
                    }
                }
            }

            const detailedMeals = await getMultipleMealsWithDetails(mealsToGet, token);
            
            mealPlan.push({
                servingTime,
                meals: selectedMeals.map((mealItem, index) => ({
                    meal_id: mealItem.meal_id,
                    isEaten: false,
                    portionSize: mealItem.portionSize,
                    mealDetail: detailedMeals[index] || null
                }))
            });
        }

        const newMealPlan = {
            user_id: userId,
            date: new Date(date),
            mealPlan,
            forFamily: userProfile.isFamily,
            generatedByAI: true,
            aiMetadata: {
                userProfile: {
                    dietType: userProfile.dietaryPreferences?.DietType_id,
                    allergies: userProfile.dietaryPreferences?.allergies,
                    dislikeIngredients: userProfile.dietaryPreferences?.dislikeIngredients,
                    targetCalories: userProfile.nutritionGoals?.caloriesPerDay
                },
                generatedAt: new Date(),
                categoryRecommendations: categoryRecommendations,
                regenerationCount: 1 // Track số lần generate
            }
        };

        // Lưu vào Redis với TTL
        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        console.log('=== HOÀN THÀNH: Tạo thực đơn AI mới thành công ===');
        res.json({ 
            success: true, 
            data: newMealPlan, 
            fromCache: false,
            regenerated: true, // Flag cho biết đã generate mới
            message: '🎲 Thực đơn mới được tạo bởi AI với các món ăn khác nhau!'
        });
    } catch (error) {
        console.error('=== LỖI: Tạo thực đơn AI thất bại ===');
        console.error(error);
        res.status(500).json({ 
            error: 'Lỗi tạo thực đơn bằng AI', 
            details: error.message 
        });
    }
};

// Toggle trạng thái món ăn (tick/untick "Đã ăn")
const toggleMealEatenStatus = async (req, res) => {
    try {
        const { date, servingTime, mealId, action } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Validate input
        if (!date || !servingTime || !mealId || !action) {
            return res.status(400).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: 'Thiếu thông tin bắt buộc (date, servingTime, mealId, action)'
            });
        }

        if (!['EAT', 'UNEAT'].includes(action)) {
            return res.status(400).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: 'Action phải là "EAT" hoặc "UNEAT"'
            });
        }

        console.log(`🍽️  ${action === 'EAT' ? 'Đánh dấu đã ăn' : 'Bỏ đánh dấu'} món: ${mealId}`);

        // ============= BƯỚC 1: LẤY MEAL PLAN TỪ REDIS =============
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: 'Không tìm thấy thực đơn trong cache'
            });
        }

        // ============= BƯỚC 2: TÌM MÓN ĂN =============
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: `Không tìm thấy bữa ${servingTime}`
            });
        }

        const meal = mealSection.meals.find(m => m.meal_id.toString() === mealId);
        if (!meal) {
            return res.status(404).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: 'Không tìm thấy món ăn'
            });
        }

        // ============= BƯỚC 3: TẠO EVENT HISTORY =============
        // Tìm hoặc tạo meal plan trong DB để lấy ID
        let dbMealPlan = await MealPlan.findOne({
            user_id: userId,
            date: new Date(date)
        });

        if (!dbMealPlan) {
            // Nếu chưa có trong DB, tạo mới
            const dataToSave = {
                ...mealPlan,
                mealPlan: mealPlan.mealPlan.map(section => ({
                    ...section,
                    meals: section.meals.map(m => ({
                        meal_id: m.meal_id,
                        isEaten: m.isEaten,
                        portionSize: m.portionSize
                    }))
                }))
            };
            dbMealPlan = new MealPlan(dataToSave);
            await dbMealPlan.save();
        }

        // Tạo history event
        const historyEvent = new MealPlanHistory({
            dailyMealPlan_id: dbMealPlan._id,
            user_id: userId,
            meal_id: mealId,
            servingTime: servingTime,
            action: action,
            portionSize: meal.portionSize,
            timestamp: new Date()
        });

        await historyEvent.save();
        console.log(`✓ Đã tạo history event: ${action}`);

        // ============= BƯỚC 4: CẬP NHẬT TRẠNG THÁI =============
        meal.isEaten = action === 'EAT';

        // Cập nhật Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        // Cập nhật DB
        const mealInDb = dbMealPlan.mealPlan
            .find(mp => mp.servingTime === servingTime)
            ?.meals.find(m => m.meal_id.toString() === mealId);
        
        if (mealInDb) {
            mealInDb.isEaten = action === 'EAT';
            await dbMealPlan.save();
        }

        console.log(`✅ Cập nhật trạng thái: isEaten = ${action === 'EAT'}`);

        res.json({
            type: "TOGGLE_MEAL_EATEN",
            status: true,
            success: true,
            message: action === 'EAT' ? '✅ Đã đánh dấu món ăn' : '↩️  Đã bỏ đánh dấu',
            data: {
                mealPlan: mealPlan,
                historyEvent: {
                    _id: historyEvent._id,
                    action: historyEvent.action,
                    timestamp: historyEvent.timestamp
                }
            }
        });
    } catch (error) {
        console.error('❌ Error toggling meal eaten status:', error);
        res.status(500).json({
            type: "TOGGLE_MEAL_EATEN",
            status: false,
            error: 'Lỗi cập nhật trạng thái món ăn',
            details: error.message
        });
    }
};

// Lấy lịch sử ăn uống của user (có lọc món đã ăn)
const getMealHistory = async (req, res) => {
    try {
        const userId = req.user_id;
        const { 
            date,
            servingTime,
            onlyEaten = false,
            page = 1,
            limit = 50
        } = req.query;

        console.log('📊 Lấy lịch sử ăn uống...');

        // Build query filter
        const filter = { user_id: userId };

        // Lọc theo ngày cụ thể
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            
            filter.timestamp = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        // Lọc theo bữa ăn
        if (servingTime) {
            const servingTimes = typeof servingTime === 'string' 
                ? servingTime.split(',').map(s => s.trim())
                : Array.isArray(servingTime) 
                    ? servingTime 
                    : [servingTime];
            
            if (servingTimes.length > 1) {
                filter.servingTime = { $in: servingTimes };
            } else if (servingTimes.length === 1) {
                filter.servingTime = servingTimes[0];
            }
        }

        // Lọc chỉ món đã ăn
        if (onlyEaten === 'true') {
            filter.action = 'EAT';
        }

        console.log('🔍 Filter:', filter);

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Query history
        const [historyEvents, total] = await Promise.all([
            MealPlanHistory.find(filter)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('dailyMealPlan_id', 'date forFamily generatedByAI')
                .lean(),
            MealPlanHistory.countDocuments(filter)
        ]);

        // Lấy chi tiết món ăn cho mỗi event qua API /meal/:meal_id
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        const enrichedHistory = [];
        for (const event of historyEvents) {
            try {
                // Gọi API lấy chi tiết món ăn (đã bao gồm ingredients details)
                const mealDetailResponse = await getMealDetailById(event.meal_id.toString(), token);
                
                if (mealDetailResponse && mealDetailResponse.status && mealDetailResponse.data) {
                    const mealData = mealDetailResponse.data;
                    
                    // Tính dinh dưỡng thực tế dựa trên portion size
                    let actualNutrition = null;
                    if (mealData.ingredients && event.portionSize) {
                        // Tính tổng nutrition từ ingredients
                        let totalCalories = 0;
                        let totalProtein = 0;
                        let totalCarbs = 0;
                        let totalFat = 0;

                        mealData.ingredients.forEach(ing => {
                            if (ing.detail && ing.detail.nutrition) {
                                // Tính nutrition dựa trên quantity (giả sử per 100g)
                                const ratio = ing.quantity / 100;
                                totalCalories += (ing.detail.nutrition.calories || 0) * ratio;
                                totalProtein += (ing.detail.nutrition.protein || 0) * ratio;
                                totalCarbs += (ing.detail.nutrition.carbs || 0) * ratio;
                                totalFat += (ing.detail.nutrition.fat || 0) * ratio;
                            }
                        });

                        // Nhân với portion size
                        actualNutrition = {
                            portionAmount: event.portionSize.amount,
                            portionUnit: event.portionSize.unit,
                            calories: Math.round(totalCalories * event.portionSize.amount),
                            protein: Math.round(totalProtein * event.portionSize.amount * 10) / 10,
                            carbs: Math.round(totalCarbs * event.portionSize.amount * 10) / 10,
                            fat: Math.round(totalFat * event.portionSize.amount * 10) / 10
                        };
                    }

                    enrichedHistory.push({
                        ...event,
                        mealDetail: {
                            _id: mealData._id,
                            nameMeal: mealData.nameMeal,
                            description: mealData.description,
                            mealImage: mealData.mealImage,
                            mealCategory: mealData.mealCategory,
                            ingredients: mealData.ingredients, // Bao gồm cả detail của ingredients
                            recipe: mealData.recipe,
                            popularity: mealData.popularity,
                            // Thông tin dinh dưỡng tổng hợp từ ingredients
                            totalNutrition: actualNutrition ? {
                                calories: actualNutrition.calories / event.portionSize.amount,
                                protein: actualNutrition.protein / event.portionSize.amount,
                                carbs: actualNutrition.carbs / event.portionSize.amount,
                                fat: actualNutrition.fat / event.portionSize.amount
                            } : null,
                            actualNutrition: actualNutrition
                        }
                    });
                } else {
                    // Nếu không lấy được detail, vẫn giữ event
                    enrichedHistory.push({
                        ...event,
                        mealDetail: null
                    });
                }
            } catch (error) {
                console.error(`Error fetching meal detail for ${event.meal_id}:`, error.message);
                enrichedHistory.push({
                    ...event,
                    mealDetail: null
                });
            }
        }

        // Thống kê
        const baseStatsFilter = {
            user_id: userId,
            action: 'EAT'
        };
        
        if (date) {
            baseStatsFilter.timestamp = filter.timestamp;
        }

        // Tính tổng dinh dưỡng đã tiêu thụ
        let totalNutrition = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0
        };

        enrichedHistory.forEach(event => {
            if (event.action === 'EAT' && event.mealDetail?.actualNutrition) {
                const nutrition = event.mealDetail.actualNutrition;
                totalNutrition.calories += nutrition.calories || 0;
                totalNutrition.protein += nutrition.protein || 0;
                totalNutrition.carbs += nutrition.carbs || 0;
                totalNutrition.fat += nutrition.fat || 0;
            }
        });

        // Làm tròn tổng dinh dưỡng
        totalNutrition = {
            calories: Math.round(totalNutrition.calories),
            protein: Math.round(totalNutrition.protein * 10) / 10,
            carbs: Math.round(totalNutrition.carbs * 10) / 10,
            fat: Math.round(totalNutrition.fat * 10) / 10
        };

        const stats = {
            totalEvents: total,
            totalEaten: await MealPlanHistory.countDocuments(baseStatsFilter),
            byServingTime: {
                breakfast: await MealPlanHistory.countDocuments({
                    ...baseStatsFilter,
                    servingTime: 'breakfast'
                }),
                lunch: await MealPlanHistory.countDocuments({
                    ...baseStatsFilter,
                    servingTime: 'lunch'
                }),
                dinner: await MealPlanHistory.countDocuments({
                    ...baseStatsFilter,
                    servingTime: 'dinner'
                })
            },
            totalNutrition: totalNutrition
        };

        console.log('✅ Lấy lịch sử thành công');

        res.json({
            type: "GET_MEAL_HISTORY",
            status: true,
            success: true,
            message: 'Lấy lịch sử ăn uống thành công',
            data: {
                history: enrichedHistory,
                stats: stats,
                filter: {
                    date: date || 'all',
                    servingTime: servingTime || 'all',
                    onlyEaten: onlyEaten === 'true'
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('❌ Error getting meal history:', error);
        res.status(500).json({
            type: "GET_MEAL_HISTORY",
            status: false,
            error: 'Lỗi lấy lịch sử ăn uống',
            details: error.message
        });
    }
};

// Lấy trạng thái cuối cùng của một món cụ thể
const getLastMealStatus = async (req, res) => {
    try {
        const { dailyMealPlan_id, meal_id } = req.query;
        const userId = req.user_id;

        if (!dailyMealPlan_id || !meal_id) {
            return res.status(400).json({
                type: "GET_LAST_MEAL_STATUS",
                status: false,
                error: 'Thiếu dailyMealPlan_id hoặc meal_id'
            });
        }

        // Lấy event cuối cùng
        const lastEvent = await MealPlanHistory.findOne({
            dailyMealPlan_id,
            meal_id,
            user_id: userId
        })
        .sort({ timestamp: -1 })
        .limit(1)
        .lean();

        if (!lastEvent) {
            return res.json({
                type: "GET_LAST_MEAL_STATUS",
                status: true,
                success: true,
                data: {
                    isEaten: false,
                    lastAction: null,
                    message: 'Chưa có lịch sử cho món này'
                }
            });
        }

        res.json({
            type: "GET_LAST_MEAL_STATUS",
            status: true,
            success: true,
            data: {
                isEaten: lastEvent.action === 'EAT',
                lastAction: lastEvent.action,
                timestamp: lastEvent.timestamp,
                portionSize: lastEvent.portionSize
            }
        });
    } catch (error) {
        console.error('Error getting last meal status:', error);
        res.status(500).json({
            type: "GET_LAST_MEAL_STATUS",
            status: false,
            error: 'Lỗi lấy trạng thái món ăn',
            details: error.message
        });
    }
};

const test = (req, res) => {
    console.log('Test function in MealPlanController');
    res.json({ message: 'Test function executed successfully' });
}


module.exports = {
    generateMealPlan,
    generateAIMealPlan: generateAIMealPlanController,
    replaceMeal,
    removeMeal,
    saveMealPlan,
    getMealPlanFromCache,
    getMealPlanFromDatabase,
    getSimilarMeals,
    toggleMealEatenStatus,
    getMealHistory,
    getLastMealStatus,
    test
};
