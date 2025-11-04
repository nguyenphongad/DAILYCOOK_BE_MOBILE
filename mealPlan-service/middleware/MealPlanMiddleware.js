const { verifyUserToken } = require('../utils/apiUtils');
const { checkRedisConnection } = require('../utils/redisUtils');

// Middleware xác thực token và lấy user_id
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'Token không được cung cấp' });
        }

        // Sử dụng apiUtils để verify token
        const userData = await verifyUserToken(token);
        
        if (!userData.isLogin) {
            return res.status(401).json({ error: 'Token không hợp lệ' });
        }
        
        req.user_id = userData.user._id;
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

// Middleware kiểm tra Redis connection
const checkRedis = async (req, res, next) => {
    try {
        const redis = req.app.locals.redis;
        const isConnected = await checkRedisConnection(redis);
        
        if (!isConnected) {
            console.warn('Redis connection failed, continuing without cache');
        }
        
        next();
    } catch (error) {
        console.error('Redis middleware error:', error);
        next(); // Continue without Redis
    }
};

module.exports = {
    authenticateUser,
    validateApiKey,
    checkRedis
};
