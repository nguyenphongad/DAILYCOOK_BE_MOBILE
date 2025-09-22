const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// routes
const IngredientRoute = require('./routes/IngredientRoute');

const app = express();

app.use(express.static('public'));


app.use(bodyParser.json({ limit: '30mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '30mb', extended: true }));

// Tăng kích thước giới hạn của JSON
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Cấu hình CORS chi tiết hơn
app.use(cors({
    origin: '*',  //  cần giới hạn nguồn gốc khi ở bản tung ra
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

dotenv.config();

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
        app.listen(process.env.PORT, () => {
            console.log('INGREDIENT-SERVICE listening at port ' + process.env.PORT);
        })
    })
    .catch((error) => console.log(error));

// Thêm health endpoint ở root level
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'ingrdient-service',
        timestamp: new Date().toISOString()
    });
});

// Thêm error handling middleware
app.use((err, req, res, next) => {
    console.error('Ingredient service error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message
    });
});

// Các routes khác
app.use('/api/ingredient', IngredientRoute)