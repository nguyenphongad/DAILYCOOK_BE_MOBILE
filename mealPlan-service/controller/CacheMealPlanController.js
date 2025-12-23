const { saveMealPlanToRedis } = require('../utils/redisUtils');

// Lưu meal plan vào Redis cache (để chuẩn bị cho việc save vào DB)
const cacheMealPlan = async (req, res) => {
    try {
        const { date, mealPlan, forFamily, generatedByAI, aiMetadata } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Validate input
        if (!date) {
            return res.status(400).json({
                type: "CACHE_MEAL_PLAN",
                status: false,
                error: 'Ngày không được để trống'
            });
        }

        if (!mealPlan || !Array.isArray(mealPlan)) {
            return res.status(400).json({
                type: "CACHE_MEAL_PLAN",
                status: false,
                error: 'Meal plan phải là một mảng'
            });
        }

        // Validate meal plan structure
        for (const section of mealPlan) {
            if (!section.servingTime || !['breakfast', 'lunch', 'dinner'].includes(section.servingTime)) {
                return res.status(400).json({
                    type: "CACHE_MEAL_PLAN",
                    status: false,
                    error: 'servingTime phải là breakfast, lunch hoặc dinner'
                });
            }

            if (!Array.isArray(section.meals)) {
                return res.status(400).json({
                    type: "CACHE_MEAL_PLAN",
                    status: false,
                    error: 'Meals phải là một mảng'
                });
            }

            for (const meal of section.meals) {
                if (!meal.meal_id) {
                    return res.status(400).json({
                        type: "CACHE_MEAL_PLAN",
                        status: false,
                        error: 'Mỗi món ăn phải có meal_id'
                    });
                }

                if (!meal.portionSize || !meal.portionSize.amount || !meal.portionSize.unit) {
                    return res.status(400).json({
                        type: "CACHE_MEAL_PLAN",
                        status: false,
                        error: 'Mỗi món ăn phải có portionSize với amount và unit'
                    });
                }
            }
        }

        // Chuẩn bị dữ liệu để cache
        const mealPlanData = {
            user_id: userId,
            date: new Date(date),
            mealPlan,
            forFamily: forFamily || false,
            generatedByAI: generatedByAI || false,
            aiMetadata: aiMetadata || null
        };

        // Lưu vào Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlanData);

        console.log(`✅ Đã lưu meal plan vào Redis cache cho user ${userId}, date ${date}`);

        res.json({
            type: "CACHE_MEAL_PLAN",
            status: true,
            success: true,
            message: '✅ Lưu meal plan vào cache thành công! Giờ có thể gọi /save để lưu vào database.',
            data: {
                user_id: userId,
                date: date,
                cached: true,
                cachedAt: new Date(),
                ttl: '24 hours'
            }
        });

    } catch (error) {
        console.error('❌ Error caching meal plan:', error);
        res.status(500).json({
            type: "CACHE_MEAL_PLAN",
            status: false,
            error: 'Lỗi lưu meal plan vào cache',
            details: error.message
        });
    }
};

module.exports = {
    cacheMealPlan
};
