// Redis key patterns
const REDIS_KEYS = {
    MEAL_PLAN: (userId, date) => `mealplan:${userId}:${date}`,
    USER_PREFERENCES: (userId) => `user_pref:${userId}`,
    MEAL_CACHE: (mealId) => `meal:${mealId}`,
    ALL_MEALS: 'all_meals'
};

// Cache TTL (Time To Live) settings
const CACHE_TTL = {
    MEAL_PLAN: 3600 * 24, // 24 hours
    USER_PREFERENCES: 3600 * 24 * 7, // 7 days
    MEAL_CACHE: 3600 * 12, // 12 hours
    ALL_MEALS: 3600 * 6 // 6 hours
};

// Lưu meal plan vào Redis
const saveMealPlanToRedis = async (redis, userId, date, mealPlan) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        const data = JSON.stringify(mealPlan);
        await redis.setEx(key, CACHE_TTL.MEAL_PLAN, data);
        console.log(`Saved meal plan to Redis: ${key}`);
    } catch (error) {
        console.error('Error saving meal plan to Redis:', error);
        throw new Error('Lỗi lưu thực đơn vào cache');
    }
};

// Lấy meal plan từ Redis
const getMealPlanFromRedis = async (redis, userId, date) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        const data = await redis.get(key);
        if (data) {
            console.log(`Retrieved meal plan from Redis: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error getting meal plan from Redis:', error);
        return null;
    }
};

// Xóa meal plan khỏi Redis
const deleteMealPlanFromRedis = async (redis, userId, date) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        await redis.del(key);
        console.log(`Deleted meal plan from Redis: ${key}`);
    } catch (error) {
        console.error('Error deleting meal plan from Redis:', error);
    }
};

// Kiểm tra Redis connection
const checkRedisConnection = async (redis) => {
    try {
        await redis.ping();
        return true;
    } catch (error) {
        console.error('Redis connection failed:', error);
        return false;
    }
};

module.exports = {
    // Core meal plan operations
    saveMealPlanToRedis,
    getMealPlanFromRedis,
    deleteMealPlanFromRedis,
    
    // Utility functions
    checkRedisConnection,
    
    // Constants
    REDIS_KEYS,
    CACHE_TTL
};
