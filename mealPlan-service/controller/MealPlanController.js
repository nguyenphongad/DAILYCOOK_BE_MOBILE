const MealPlan = require('../models/MealPlanModel');
const { generateSimpleMealPlan, generateAIBasedMealPlan } = require('../utils/genAIUtils');
const {
    saveMealPlanToRedis,
    getMealPlanFromRedis
} = require('../utils/redisUtils');
const {
    getAllMeals,
    getMultipleMealsWithDetails,
    getUserProfile,
    getMealCategories,
    getMealsByCategory
} = require('../utils/apiUtils');

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

// Đổi món trong thực đơn
const replaceMeal = async (req, res) => {
    try {
        const { date, servingTime, oldMealId, newMealId, portionSize } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date || !servingTime || !oldMealId || !newMealId) {
            return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
        }

        // Lấy meal plan từ Redis
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
        }

        // Tìm và đổi món
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({ error: 'Không tìm thấy bữa ăn' });
        }

        const mealIndex = mealSection.meals.findIndex(meal => meal.meal_id.toString() === oldMealId);
        if (mealIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn' });
        }

        // Lấy chi tiết món ăn mới với token
        const allMeals = await fetchAllMeals(token);
        const newMealData = allMeals.data.meals.find(m => m._id === newMealId);
        
        let newMealDetail = null;
        if (newMealData) {
            const detailedMeals = await getMultipleMealsWithDetails([newMealData], token);
            newMealDetail = detailedMeals[0];
        }

        // Thay thế món ăn
        mealSection.meals[mealIndex] = {
            meal_id: newMealId,
            isEaten: false,
            portionSize: portionSize || { amount: mealPlan.forFamily ? 4 : 1, unit: "portion" },
            mealDetail: newMealDetail
        };

        // Cập nhật Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        res.json({ success: true, data: mealPlan, message: 'Đổi món thành công' });
    } catch (error) {
        console.error('Error replacing meal:', error);
        res.status(500).json({ error: 'Lỗi đổi món', details: error.message });
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
            return res.status(400).json({ error: 'Ngày không được để trống' });
        }

        // Lấy meal plan từ Redis
        const mealPlanData = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlanData) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn trong cache' });
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
        const existingMealPlan = await MealPlan.findOne({ 
            user_id: userId, 
            date: new Date(date) 
        });

        if (existingMealPlan) {
            // Cập nhật meal plan hiện có
            await MealPlan.updateOne(
                { user_id: userId, date: new Date(date) },
                { $set: {
                    mealPlan: dataToSave.mealPlan,
                    forFamily: dataToSave.forFamily,
                    updatedAt: new Date()
                }}
            );
        } else {
            // Tạo meal plan mới
            const newMealPlan = new MealPlan(dataToSave);
            await newMealPlan.save();
        }

        res.json({ success: true, message: 'Lưu thực đơn thành công' });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ error: 'Lỗi lưu thực đơn', details: error.message });
    }
};

// Lấy thực đơn
const getMealPlan = async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        if (!date) {
            return res.status(400).json({ error: 'Ngày không được để trống' });
        }

        // Kiểm tra Redis trước
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        let fromCache = true;
        
        if (!mealPlan) {
            // Nếu không có trong Redis, tìm trong database
            mealPlan = await MealPlan.findOne({ 
                user_id: userId, 
                date: new Date(date) 
            });

            if (mealPlan) {
                // Lưu lại vào Redis
                await saveMealPlanToRedis(redis, userId, date, mealPlan);
                fromCache = false;
            }
        }

        res.json({ 
            success: true, 
            data: mealPlan, 
            fromCache 
        });
    } catch (error) {
        console.error('Error getting meal plan:', error);
        res.status(500).json({ error: 'Lỗi lấy thực đơn', details: error.message });
    }
};

// Gợi ý món ăn tương tự
const getSimilarMeals = async (req, res) => {
    try {
        const { mealId } = req.params;
        const userId = req.user_id;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!mealId) {
            return res.status(400).json({ error: 'Meal ID không được để trống' });
        }

        // Lấy danh sách tất cả món ăn
        const allMeals = await fetchAllMeals(token);
        
        if (!allMeals?.data?.meals || allMeals.data.meals.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn nào' });
        }

        // Tìm món ăn hiện tại
        const currentMeal = allMeals.data.meals.find(meal => meal._id === mealId);
        if (!currentMeal) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn' });
        }

        // Lọc các món ăn khác (loại bỏ món hiện tại)
        const otherMeals = allMeals.data.meals.filter(meal => meal._id !== mealId);
        
        // Gợi ý đơn giản: chọn random 3 món từ cùng category hoặc random nếu không có
        let similarMeals = [];
        
        // Ưu tiên món cùng category
        const sameCategoryMeals = otherMeals.filter(meal => 
            meal.mealCategory === currentMeal.mealCategory
        );
        
        if (sameCategoryMeals.length >= 3) {
            // Chọn random 3 món từ cùng category
            const shuffled = [...sameCategoryMeals].sort(() => 0.5 - Math.random());
            similarMeals = shuffled.slice(0, 3);
        } else {
            // Nếu không đủ 3 món cùng category, bổ sung từ các món khác
            const shuffledOthers = [...otherMeals].sort(() => 0.5 - Math.random());
            similarMeals = shuffledOthers.slice(0, 3);
        }

        // Lấy chi tiết đầy đủ của các món tương tự
        const detailedSimilarMeals = await getMultipleMealsWithDetails(similarMeals, token);

        res.json({
            success: true,
            data: {
                currentMeal: currentMeal,
                similarMeals: detailedSimilarMeals,
                total: detailedSimilarMeals.length
            },
            message: 'Lấy danh sách món tương tự thành công'
        });

    } catch (error) {
        console.error('Error getting similar meals:', error);
        res.status(500).json({ error: 'Lỗi lấy món tương tự', details: error.message });
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

        // Kiểm tra cache Redis trước
        const cached = await getMealPlanFromRedis(redis, userId, date);
        if (cached && cached.generatedByAI) {
            return res.json({ 
                success: true, 
                data: cached, 
                fromCache: true 
            });
        }

        // Lấy thông tin user profile
        const userProfileResponse = await getUserProfile(userId, token);
        if (!userProfileResponse.success) {
            return res.status(404).json({ 
                error: 'Không tìm thấy thông tin người dùng. Vui lòng hoàn thành khảo sát trước.' 
            });
        }

        const userProfile = userProfileResponse.data;

        // Lấy danh mục món ăn
        const mealCategoriesResponse = await getMealCategories(token);
        const mealCategories = mealCategoriesResponse.data || [];

        // Lấy tất cả món ăn từ các danh mục
        const allMealsPromises = mealCategories.map(category => 
            getMealsByCategory(category._id, token)
        );
        const allMealsResults = await Promise.all(allMealsPromises);
        const allMeals = allMealsResults.flatMap(result => result.data || []);

        if (allMeals.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn nào' });
        }

        // Gọi AI để tạo thực đơn
        const aiMealPlan = await generateAIBasedMealPlan({
            date,
            forFamily,
            userProfile,
            allMeals
        });

        // Lấy chi tiết đầy đủ của các món ăn đã chọn
        const mealPlan = [];
        for (const [servingTime, mealIds] of Object.entries(aiMealPlan)) {
            const mealsToGet = mealIds.map(mealId => 
                allMeals.find(m => m._id === mealId.meal_id)
            ).filter(Boolean);
            
            const detailedMeals = await getMultipleMealsWithDetails(mealsToGet, token);
            
            mealPlan.push({
                servingTime,
                meals: mealIds.map((mealId, index) => ({
                    meal_id: mealId.meal_id,
                    isEaten: false,
                    portionSize: mealId.portionSize,
                    mealDetail: detailedMeals[index] || null
                }))
            });
        }

        const newMealPlan = {
            user_id: userId,
            date: new Date(date),
            mealPlan,
            forFamily,
            generatedByAI: true,
            aiMetadata: {
                userProfile: {
                    dietType: userProfile.dietaryPreferences?.DietType_id,
                    allergies: userProfile.dietaryPreferences?.allergies,
                    dislikeIngredients: userProfile.dietaryPreferences?.dislikeIngredients
                },
                generatedAt: new Date()
            }
        };

        // Lưu vào Redis
        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        res.json({ 
            success: true, 
            data: newMealPlan, 
            fromCache: false,
            message: 'Thực đơn được tạo bởi AI dựa trên thông tin cá nhân và sở thích của bạn'
        });
    } catch (error) {
        console.error('Error generating AI meal plan:', error);
        res.status(500).json({ 
            error: 'Lỗi tạo thực đơn bằng AI', 
            details: error.message 
        });
    }
};

module.exports = {
    generateMealPlan,
    generateAIMealPlan: generateAIMealPlanController,
    replaceMeal,
    removeMeal,
    saveMealPlan,
    getMealPlan,
    getSimilarMeals
};
