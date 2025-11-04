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

// Lưu user preferences
const saveUserPreferencesToRedis = async (redis, userId, preferences) => {
    try {
        const key = REDIS_KEYS.USER_PREFERENCES(userId);
        const data = JSON.stringify(preferences);
        await redis.setEx(key, CACHE_TTL.USER_PREFERENCES, data);
        console.log(`Saved user preferences to Redis: ${key}`);
    } catch (error) {
        console.error('Error saving user preferences to Redis:', error);
    }
};

// Lấy user preferences
const getUserPreferencesFromRedis = async (redis, userId) => {
    try {
        const key = REDIS_KEYS.USER_PREFERENCES(userId);
        const data = await redis.get(key);
        if (data) {
            console.log(`Retrieved user preferences from Redis: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error getting user preferences from Redis:', error);
        return null;
    }
};

// Cache danh sách tất cả món ăn
const saveAllMealsToRedis = async (redis, meals) => {
    try {
        const key = REDIS_KEYS.ALL_MEALS;
        const data = JSON.stringify(meals);
        await redis.setEx(key, CACHE_TTL.ALL_MEALS, data);
        console.log(`Saved all meals to Redis: ${key}`);
    } catch (error) {
        console.error('Error saving all meals to Redis:', error);
    }
};

// Lấy danh sách tất cả món ăn từ cache
const getAllMealsFromRedis = async (redis) => {
    try {
        const key = REDIS_KEYS.ALL_MEALS;
        const data = await redis.get(key);
        if (data) {
            console.log(`Retrieved all meals from Redis: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error getting all meals from Redis:', error);
        return null;
    }
};

// Cache thông tin một món ăn cụ thể
const saveMealToRedis = async (redis, mealId, mealData) => {
    try {
        const key = REDIS_KEYS.MEAL_CACHE(mealId);
        const data = JSON.stringify(mealData);
        await redis.setEx(key, CACHE_TTL.MEAL_CACHE, data);
        console.log(`Saved meal to Redis: ${key}`);
    } catch (error) {
        console.error('Error saving meal to Redis:', error);
    }
};

// Lấy thông tin món ăn từ cache
const getMealFromRedis = async (redis, mealId) => {
    try {
        const key = REDIS_KEYS.MEAL_CACHE(mealId);
        const data = await redis.get(key);
        if (data) {
            console.log(`Retrieved meal from Redis: ${key}`);
            return JSON.parse(data);
        }
        return null;
    } catch (error) {
        console.error('Error getting meal from Redis:', error);
        return null;
    }
};

// Xóa tất cả cache của user
const clearUserCache = async (redis, userId) => {
    try {
        const pattern = `*${userId}*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} cache entries for user: ${userId}`);
        }
    } catch (error) {
        console.error('Error clearing user cache:', error);
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
    
    // User preferences
    saveUserPreferencesToRedis,
    getUserPreferencesFromRedis,
    
    // Meals cache
    saveAllMealsToRedis,
    getAllMealsFromRedis,
    saveMealToRedis,
    getMealFromRedis,
    
    // Utility functions
    clearUserCache,
    checkRedisConnection,
    
    // Constants
    REDIS_KEYS,
    CACHE_TTL
};
