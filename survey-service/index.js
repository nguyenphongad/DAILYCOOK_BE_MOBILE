require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const surveyRouter = require('./routes/SurveyRouter');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());


// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Thêm health endpoint ở root level
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'survey-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/surveys', surveyRouter);

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(403).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
            error: err.message
        });
    }
    res.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi!',
        error: err.message
    });
});

const PORT = process.env.PORT || 5008;
app.listen(PORT, () => {
    console.log(`Survey Service is running on port ${PORT}`);
    console.log(`API Key protection: ${process.env.API_KEY ? 'Enabled' : 'Disabled'}`);
});
