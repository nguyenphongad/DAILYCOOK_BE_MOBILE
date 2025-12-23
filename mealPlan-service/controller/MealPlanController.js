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
    selectSimilarMealsWithAI,
    getFallbackMealsByCategory // ✅ Import function mới
} = require('../utils/genAIUtils');
const mongoose = require('mongoose'); // Thêm import

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
            message: '🤖 AI đã chọn 5 món tương tự phù hợp nhất!',
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

        console.log('🗑️  Xóa meal plan cũ trong Redis (nếu có)...');
        await deleteMealPlanFromRedis(redis, userId, date);
        
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
        let categoryRecommendations;
        let useAI = true;
        
        try {
            categoryRecommendations = await analyzeDietaryNeedsWithAI({
                userProfile,
                ingredientCategories,
                mealCategories
            });
            console.log('✓ AI gợi ý danh mục:', categoryRecommendations);
        } catch (aiError) {
            console.warn('⚠️  AI lỗi, chuyển sang chế độ FALLBACK');
            useAI = false;
        }

        console.log('=== BƯỚC 5: Lấy món ăn và tạo thực đơn ===');
        const mealsByServingTime = {};
        const portionAmount = userProfile.isFamily 
            ? (userProfile.familyInfo?.children || 0) + (userProfile.familyInfo?.teenagers || 0) + (userProfile.familyInfo?.adults || 0) + (userProfile.familyInfo?.elderly || 0) || 2
            : 1;

        // ============= NẾU AI LỖI: DÙNG FALLBACK =============
        if (!useAI) {
            console.log('🔄 Sử dụng FALLBACK: Chọn món theo danh mục cố định');
            
            for (const servingTime of ['breakfast', 'lunch', 'dinner']) {
                try {
                    const selectedMeals = await getFallbackMealsByCategory({
                        servingTime,
                        mealCategories,
                        getMealsByCategoryFn: getMealsByCategoryWithLimit,
                        token,
                        isFamily: userProfile.isFamily
                    });

                    mealsByServingTime[servingTime] = selectedMeals.map(m => ({
                        meal_id: m.meal_id,
                        portionSize: {
                            amount: portionAmount,
                            unit: "portion"
                        }
                    }));

                    console.log(`✅ ${servingTime}: Chọn được ${selectedMeals.length} món (fallback)`);
                } catch (error) {
                    console.error(`❌ Lỗi fallback cho ${servingTime}:`, error);
                    return res.status(500).json({
                        error: `Không thể tạo thực đơn cho ${servingTime}`,
                        details: error.message
                    });
                }
            }
        } else {
            // ============= DÙNG AI BÌNH THƯỜNG =============
            const allMeals = await fetchAllMeals(token);
            if (!allMeals?.data?.meals || allMeals.data.meals.length === 0) {
                return res.status(404).json({ 
                    error: 'Không tìm thấy món ăn nào trong hệ thống' 
                });
            }

            for (const servingTime of ['breakfast', 'lunch', 'dinner']) {
                const categoryIds = categoryRecommendations[servingTime] || [];
                let allMealsForTime = [];

                for (const categoryId of categoryIds) {
                    try {
                        const mealsResponse = await getMealsByCategoryWithLimit(categoryId, token, 200);
                        const meals = mealsResponse.data?.meals || [];
                        allMealsForTime.push(...meals);
                    } catch (error) {
                        console.warn(`⚠️  Không thể lấy món từ category ${categoryId}:`, error.message);
                    }
                }

                if (allMealsForTime.length === 0) {
                    console.warn(`⚠️  Không có món từ danh mục cho ${servingTime}, dùng tất cả món làm fallback`);
                    allMealsForTime = allMeals.data.meals;
                }

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

                if (filteredMeals.length === 0) {
                    return res.status(400).json({
                        error: `Không tìm thấy món ăn phù hợp cho ${servingTime} sau khi lọc dị ứng/không thích.`
                    });
                }

                let selectedMeals;
                try {
                    selectedMeals = await selectMealsWithAI({
                        servingTime,
                        meals: filteredMeals,
                        userProfile,
                        targetCalories: userProfile.nutritionGoals.caloriesPerDay
                    });
                } catch (aiError) {
                    console.warn(`⚠️  AI lỗi khi chọn món cho ${servingTime}, chọn random`);
                    const numMeals = Math.min(3, filteredMeals.length);
                    const shuffled = [...filteredMeals].sort(() => Math.random() - 0.5);
                    selectedMeals = shuffled.slice(0, numMeals).map(meal => ({
                        meal_id: meal._id,
                        reason: 'Được chọn ngẫu nhiên do AI không khả dụng'
                    }));
                }

                mealsByServingTime[servingTime] = selectedMeals.map(m => ({
                    meal_id: m.meal_id,
                    portionSize: {
                        amount: portionAmount,
                        unit: "portion"
                    }
                }));
            }
        }

        console.log('=== BƯỚC 6: Lấy chi tiết đầy đủ của các món đã chọn ===');
        const allMeals = await fetchAllMeals(token);
        const mealPlan = [];
        
        for (const [servingTime, selectedMeals] of Object.entries(mealsByServingTime)) {
            const mealsToGet = [];
            
            for (const mealItem of selectedMeals) {
                const foundMeal = allMeals.data.meals.find(m => m._id === mealItem.meal_id);
                if (foundMeal) {
                    mealsToGet.push(foundMeal);
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
            generatedByAI: useAI,
            aiMetadata: {
                userProfile: {
                    dietType: userProfile.dietaryPreferences?.DietType_id,
                    allergies: userProfile.dietaryPreferences?.allergies,
                    dislikeIngredients: userProfile.dietaryPreferences?.dislikeIngredients,
                    targetCalories: userProfile.nutritionGoals?.caloriesPerDay
                },
                generatedAt: new Date(),
                categoryRecommendations: useAI ? categoryRecommendations : 'Fallback mode',
                regenerationCount: 1,
                usedFallback: !useAI
            }
        };

        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        console.log('=== HOÀN THÀNH: Tạo thực đơn thành công ===');
        res.json({ 
            success: true, 
            data: newMealPlan, 
            fromCache: false,
            regenerated: true,
            usedAI: useAI,
            message: useAI 
                ? 'Thực đơn được tạo bởi AI với các món ăn khác nhau!'
                : 'Thực đơn được tạo bằng chế độ fallback (AI không khả dụng)'
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


// Toggle trạng thái món ăn (tick/untick "Đã ăn") - UPDATE HOẶC CREATE
const toggleMealEatenStatus = async (req, res) => {
    try {
        const { date, servingTime, mealId, action } = req.body;
        const userId = req.user_id;

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

        // Parse date đúng cách (YYYY-MM-DD)
        const [year, month, day] = date.split('-').map(Number);
        const normalizedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

        console.log('📅 Date received:', date);
        console.log('📅 Date normalized (UTC):', normalizedDate.toISOString());

        // Lấy meal plan từ database
        let dbMealPlan = await MealPlan.findOne({
            user_id: userId,
            date: normalizedDate
        });

        if (!dbMealPlan) {
            return res.status(404).json({
                type: "TOGGLE_MEAL_EATEN",
                status: false,
                error: 'Không tìm thấy thực đơn trong database. Vui lòng lưu thực đơn trước.'
            });
        }

        const mealPlanData = dbMealPlan.toObject();
        const mealSection = mealPlanData.mealPlan.find(mp => mp.servingTime === servingTime);
        
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

        // Lưu timestamp với ngày người dùng chọn
        const historyTimestamp = new Date(Date.UTC(year, month - 1, day, 
            new Date().getUTCHours(), 
            new Date().getUTCMinutes(), 
            new Date().getUTCSeconds()
        ));

        const historyEvent = await MealPlanHistory.findOneAndUpdate(
            {
                user_id: userId,
                meal_id: mealId
            },
            {
                $set: {
                    dailyMealPlan_id: dbMealPlan._id,
                    servingTime: servingTime,
                    lastAction: action,
                    portionSize: meal.portionSize,
                    timestamp: historyTimestamp
                }
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        console.log('✅ History saved with timestamp:', historyTimestamp.toISOString());

        // Cập nhật trạng thái trong DB
        const mealInDb = dbMealPlan.mealPlan
            .find(mp => mp.servingTime === servingTime)
            ?.meals.find(m => m.meal_id.toString() === mealId);
        
        if (mealInDb) {
            mealInDb.isEaten = action === 'EAT';
            await dbMealPlan.save();
        }

        res.json({
            type: "TOGGLE_MEAL_EATEN",
            status: true,
            success: true,
            message: action === 'EAT' ? '✅ Đã đánh dấu món ăn' : '↩️  Đã bỏ đánh dấu',
            data: {
                mealPlan: mealPlanData,
                historyEvent: {
                    _id: historyEvent._id,
                    lastAction: historyEvent.lastAction,
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

// Lấy lịch sử ăn uống (CHỈ MÓN CÓ lastAction = "EAT")
const getMealHistory = async (req, res) => {
    try {
        const userId = req.user_id;
        const { 
            date,
            servingTime,
            page = 1,
            limit = 50
        } = req.query;

        // Build filter
        const baseFilter = { 
            user_id: mongoose.Types.ObjectId.isValid(userId) 
                ? new mongoose.Types.ObjectId(userId) 
                : userId,
            lastAction: "EAT"
        };

        if (date) {
            const [year, month, day] = date.split('-').map(Number);
            const startOfDay = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
            const endOfDay = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
            
            baseFilter.timestamp = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

        if (servingTime) {
            baseFilter.servingTime = servingTime;
        }

        // Query database
        const total = await MealPlanHistory.countDocuments(baseFilter);
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const events = await MealPlanHistory.find(baseFilter)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Lấy chi tiết món ăn
        const token = req.headers.authorization?.replace('Bearer ', '');
        const enrichedHistory = [];

        for (const event of events) {
            try {
                const mealDetailResponse = await getMealDetailById(event.meal_id.toString(), token);
                
                if (mealDetailResponse?.status && mealDetailResponse.data) {
                    const mealData = mealDetailResponse.data;
                    
                    let actualNutrition = null;
                    if (mealData.ingredients && event.portionSize) {
                        let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;

                        mealData.ingredients.forEach(ing => {
                            if (ing.detail?.nutrition) {
                                const ratio = ing.quantity / 100;
                                totalCalories += (ing.detail.nutrition.calories || 0) * ratio;
                                totalProtein += (ing.detail.nutrition.protein || 0) * ratio;
                                totalCarbs += (ing.detail.nutrition.carbs || 0) * ratio;
                                totalFat += (ing.detail.nutrition.fat || 0) * ratio;
                            }
                        });

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
                        _id: event._id,
                        meal_id: event.meal_id,
                        servingTime: event.servingTime,
                        timestamp: event.timestamp,
                        portionSize: event.portionSize,
                        mealDetail: {
                            _id: mealData._id,
                            nameMeal: mealData.nameMeal,
                            mealImage: mealData.mealImage,
                            mealCategory: mealData.mealCategory,
                            ingredients: mealData.ingredients,
                            actualNutrition
                        }
                    });
                }
            } catch (error) {
                console.error(`Error fetching meal ${event.meal_id}:`, error.message);
            }
        }

        // Thống kê
        let totalNutrition = { calories: 0, protein: 0, carbs: 0, fat: 0 };

        enrichedHistory.forEach(event => {
            if (event.mealDetail?.actualNutrition) {
                const n = event.mealDetail.actualNutrition;
                totalNutrition.calories += n.calories || 0;
                totalNutrition.protein += n.protein || 0;
                totalNutrition.carbs += n.carbs || 0;
                totalNutrition.fat += n.fat || 0;
            }
        });

        totalNutrition = {
            calories: Math.round(totalNutrition.calories),
            protein: Math.round(totalNutrition.protein * 10) / 10,
            carbs: Math.round(totalNutrition.carbs * 10) / 10,
            fat: Math.round(totalNutrition.fat * 10) / 10
        };

        res.json({
            type: "GET_MEAL_HISTORY",
            status: true,
            success: true,
            message: 'Lấy lịch sử thành công',
            data: {
                history: enrichedHistory,
                stats: {
                    totalEaten: total,
                    totalNutrition
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
        console.error('❌ Error getMealHistory:', error);
        res.status(500).json({
            type: "GET_MEAL_HISTORY",
            status: false,
            error: error.message
        });
    }
};

// Lấy trạng thái cuối cùng của một món cụ thể
const getLastMealStatus = async (req, res) => {
    try {
        const { meal_id } = req.query;
        const userId = req.user_id;

        if (!meal_id) {
            return res.status(400).json({
                type: "GET_LAST_MEAL_STATUS",
                status: false,
                error: 'Thiếu meal_id'
            });
        }

        const lastEvent = await MealPlanHistory.findOne({
            user_id: userId,
            meal_id: meal_id
        });

        if (!lastEvent) {
            return res.json({
                type: "GET_LAST_MEAL_STATUS",
                status: true,
                data: {
                    isEaten: false,
                    lastAction: null,
                    message: 'Chưa có lịch sử'
                }
            });
        }

        res.json({
            type: "GET_LAST_MEAL_STATUS",
            status: true,
            data: {
                isEaten: lastEvent.lastAction === 'EAT',
                lastAction: lastEvent.lastAction,
                timestamp: lastEvent.timestamp
            }
        });
    } catch (error) {
        res.status(500).json({
            type: "GET_LAST_MEAL_STATUS",
            status: false,
            error: error.message
        });
    }
};

module.exports = {
    generateMealPlan,
    generateAIMealPlan: generateAIMealPlanController,
    replaceMeal,
    removeMeal,
    saveMealPlan,
    getMealPlanFromCache,
    getMealPlanFromDatabase,
    getSimilarMeals,
    toggleMealEatenStatus, // ✅ Thêm lại
    getMealHistory, // ✅ Thêm lại
    getLastMealStatus, // ✅ Thêm lại
};
