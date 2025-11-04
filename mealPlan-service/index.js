const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const redis = require('redis');
require('dotenv').config();

const MealRoute = require('./routes/MealRoute');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Redis connection
const redisClient = redis.createClient();
redisClient.on('error', (err) => console.log('Redis Client Error', err));
redisClient.connect();

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => console.log('MongoDB connection error:', err));

// Make Redis available globally
app.locals.redis = redisClient;

// Routes
app.use('/api/mealplans', MealRoute);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Meal Plan Service is running' });
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`Meal Plan Service running on port ${PORT}`);
});
