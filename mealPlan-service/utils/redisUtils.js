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

// Lưu meal plan vào Upstash Redis
const saveMealPlanToRedis = async (redis, userId, date, mealPlan) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        const data = JSON.stringify(mealPlan);
        
        // Upstash Redis API: setex(key, seconds, value)
        await redis.setex(key, CACHE_TTL.MEAL_PLAN, data);
        
        console.log(`Saved meal plan to Upstash Redis: ${key}`);
    } catch (error) {
        console.error('Error saving meal plan to Upstash Redis:', error);
        throw new Error('Lỗi lưu thực đơn vào cache');
    }
};

// Lấy meal plan từ Upstash Redis
const getMealPlanFromRedis = async (redis, userId, date) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        
        // Upstash Redis API: get(key)
        const data = await redis.get(key);
        
        if (data) {
            console.log(`Retrieved meal plan from Upstash Redis: ${key}`);
            // Upstash trả về object hoặc string, cần parse nếu là string
            return typeof data === 'string' ? JSON.parse(data) : data;
        }
        return null;
    } catch (error) {
        console.error('Error getting meal plan from Upstash Redis:', error);
        return null;
    }
};

// Xóa meal plan khỏi Upstash Redis
const deleteMealPlanFromRedis = async (redis, userId, date) => {
    try {
        const key = REDIS_KEYS.MEAL_PLAN(userId, date);
        
        // Upstash Redis API: del(key)
        await redis.del(key);
        
        console.log(`Deleted meal plan from Upstash Redis: ${key}`);
    } catch (error) {
        console.error('Error deleting meal plan from Upstash Redis:', error);
    }
};

// Kiểm tra Upstash Redis connection
const checkRedisConnection = async (redis) => {
    try {
        // Upstash Redis API: ping()
        const result = await redis.ping();
        return result === 'PONG';
    } catch (error) {
        console.error('Upstash Redis connection failed:', error);
        return false;
    }
};

// Lấy danh sách keys (for debugging)
const listRedisKeys = async (redis, pattern = '*') => {
    try {
        // Upstash Redis: keys(pattern)
        const keys = await redis.keys(pattern);
        return keys;
    } catch (error) {
        console.error('Error listing Redis keys:', error);
        return [];
    }
};

module.exports = {
    // Core meal plan operations
    saveMealPlanToRedis,
    getMealPlanFromRedis,
    deleteMealPlanFromRedis,
    
    // Utility functions
    checkRedisConnection,
    listRedisKeys, // Export new function
    
    // Constants
    REDIS_KEYS,
    CACHE_TTL
};
