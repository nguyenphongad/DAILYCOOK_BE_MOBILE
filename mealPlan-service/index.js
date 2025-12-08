const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Redis } = require('@upstash/redis');
require('dotenv').config();

const MealRoute = require('./routes/MealRoute');

const app = express();

// ============= CORS Configuration =============
// Allow all origins for development
app.use(cors({
    origin: '*', // Cho phép tất cả origins (development)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Upstash Redis connection
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✓ MongoDB connected successfully'))
    .catch(err => console.error('✗ MongoDB connection error:', err));

// Make Redis available globally
app.locals.redis = redis;


// Health endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'mealPlan-service',
        timestamp: new Date().toISOString(),
        redis: 'Upstash Redis',
        cors: 'enabled'
    });
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'mealPlan-service',
        message: 'Test API hoạt động bình thường',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            mealPlans: '/api/mealplans/*'
        }
    });
});

// Routes
app.use('/api/mealplans', MealRoute);

const PORT = process.env.PORT || 5004;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✓ Meal Plan Service running on port ${PORT}`);
    console.log(`✓ Server accessible at: http://0.0.0.0:${PORT}`);
    console.log(`✓ Test API: http://YOUR_IP:${PORT}/api/test`);
});
