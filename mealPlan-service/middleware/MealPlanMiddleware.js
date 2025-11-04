const axios = require('axios');

// Middleware xác thực token và lấy user_id
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token không được cung cấp' });
        }

        const response = await axios.get(`${process.env.USER_SERVICE_URL}/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': process.env.API_KEY
            }
        });

        req.user_id = response.data.user_id;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Token không hợp lệ' });
    }
};

// Middleware kiểm tra API key
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey || apiKey !== process.env.API_KEY) {
        return res.status(403).json({ error: 'API key không hợp lệ' });
    }
    
    next();
};

// Helper function để tạo Redis key
const createRedisKey = (userId, date) => {
    return `mealplan:${userId}:${date}`;
};

// Helper function để lưu meal plan vào Redis
const saveMealPlanToRedis = async (redis, userId, date, mealPlan) => {
    const key = createRedisKey(userId, date);
    await redis.setEx(key, 3600 * 24, JSON.stringify(mealPlan)); // Cache 24 hours
};

// Helper function để lấy meal plan từ Redis
const getMealPlanFromRedis = async (redis, userId, date) => {
    const key = createRedisKey(userId, date);
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

module.exports = {
    authenticateUser,
    validateApiKey,
    createRedisKey,
    saveMealPlanToRedis,
    getMealPlanFromRedis
};
