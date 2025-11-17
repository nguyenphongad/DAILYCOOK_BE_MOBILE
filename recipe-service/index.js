const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT;
const recipeRoutes = require('./routes/RecipeRoute');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kết nối MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('Kết nối MongoDB thành công');
})
.catch((error) => {
    console.error('Lỗi kết nối MongoDB:', error);
});

// Thêm health endpoint ở root level
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'recipe-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/recipes', recipeRoutes);

// Route mặc định
app.get('/', (req, res) => {
    res.send('Recipe Service API đang hoạt động');
});


// Khởi động server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});