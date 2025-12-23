const {
    saveMealPlanToRedis,
    deleteMealPlanFromRedis
} = require('../utils/redisUtils');
const {
    getAllMeals,
    getMultipleMealsWithDetails,
    getUserFullProfile,
    getAllMealCategories,
    getMealsByCategoryWithLimit
} = require('../utils/apiUtils');
const {
    getFallbackMealsByCategory
} = require('../utils/genAIUtils');

// Helper function: Lấy tất cả món ăn
const fetchAllMeals = async (token) => {
    try {
        const meals = await getAllMeals(token);
        return meals;
    } catch (error) {
        console.error('Error fetching meals:', error);
        throw new Error('Không thể tải danh sách món ăn');
    }
};

// Tạo thực đơn bằng Fallback (không dùng AI) - có delay 5s
const generateFallbackMealPlan = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;
        const token = req.headers.authorization?.replace('Bearer ', '');

        if (!date) {
            return res.status(400).json({
                error: 'Ngày không được để trống'
            });
        }

        console.log('🔄 Tạo thực đơn bằng Fallback (không AI)...');
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

        console.log('=== BƯỚC 2: Lấy danh mục món ăn ===');
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

        console.log('=== BƯỚC 3: Chọn món theo danh mục cố định (FALLBACK) ===');
        const mealsByServingTime = {};
        const portionAmount = userProfile.isFamily
            ? (userProfile.familyInfo?.children || 0) + (userProfile.familyInfo?.teenagers || 0) + (userProfile.familyInfo?.adults || 0) + (userProfile.familyInfo?.elderly || 0) || 2
            : 1;

        // Lấy món ăn cho từng bữa
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

        console.log('=== BƯỚC 4: Lấy chi tiết đầy đủ của các món đã chọn ===');
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
            generatedByAI: false,
            aiMetadata: {
                userProfile: {
                    dietType: userProfile.dietaryPreferences?.DietType_id,
                    allergies: userProfile.dietaryPreferences?.allergies,
                    dislikeIngredients: userProfile.dietaryPreferences?.dislikeIngredients,
                    targetCalories: userProfile.nutritionGoals?.caloriesPerDay
                },
                generatedAt: new Date(),
                categoryRecommendations: 'Fallback mode',
                regenerationCount: 1,
                usedFallback: true
            }
        };

        // ============= DELAY 5 GIÂY TRƯỚC KHI TRẢ VỀ =============
        console.log('⏳ Đang xử lý... (delay 1s)');
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Lưu vào Redis
        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        console.log('=== HOÀN THÀNH: Tạo thực đơn fallback thành công ===');
        res.json({
            success: true,
            data: newMealPlan,
            fromCache: false,
            usedAI: false,
            message: 'Thực đơn được tạo bằng chế độ fallback (không sử dụng AI)'
        });
    } catch (error) {
        console.error('=== LỖI: Tạo thực đơn fallback thất bại ===');
        console.error(error);
        res.status(500).json({
            error: 'Lỗi tạo thực đơn bằng fallback',
            details: error.message
        });
    }
};

module.exports = {
    generateFallbackMealPlan,
};
