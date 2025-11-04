const axios = require('axios');
const MealPlan = require('../models/MealPlanModel');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { saveMealPlanToRedis, getMealPlanFromRedis } = require('../middleware/MealPlanMiddleware');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Lấy tất cả món ăn từ Recipe Service
const fetchAllMeals = async () => {
    try {
        const response = await axios.get(`${process.env.RECIPE_SERVICE_URL}/all`, {
            headers: {
                'x-api-key': process.env.API_KEY
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching meals:', error);
        throw new Error('Không thể tải danh sách món ăn');
    }
};

// AI tạo thực đơn
const generateMealPlan = async (req, res) => {
    try {
        const { date, forFamily = false, preferences = {} } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Kiểm tra cache Redis trước
        const cached = await getMealPlanFromRedis(redis, userId, date);
        if (cached) {
            return res.json({ success: true, data: cached });
        }

        // Lấy danh sách món ăn
        const allMeals = await fetchAllMeals();
        
        // Tạo prompt cho Gemini AI
        const prompt = `
        Tạo thực đơn cho ${forFamily ? 'gia đình' : 'cá nhân'} cho ngày ${date}.
        Yêu cầu: cân bằng dinh dưỡng, đa dạng món ăn.
        Preferences: ${JSON.stringify(preferences)}
        
        Chọn từ danh sách món ăn sau: ${JSON.stringify(allMeals.slice(0, 50))}
        
        Trả về JSON format:
        {
            "breakfast": [{"meal_id": "id", "portionSize": {"amount": number, "unit": "string"}}],
            "lunch": [{"meal_id": "id", "portionSize": {"amount": number, "unit": "string"}}],
            "dinner": [{"meal_id": "id", "portionSize": {"amount": number, "unit": "string"}}]
        }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const aiMealPlan = JSON.parse(response.text());

        // Tạo cấu trúc meal plan
        const mealPlan = [];
        for (const [servingTime, meals] of Object.entries(aiMealPlan)) {
            mealPlan.push({
                servingTime,
                meals: meals.map(meal => ({
                    meal_id: meal.meal_id,
                    isEaten: false,
                    portionSize: meal.portionSize
                }))
            });
        }

        const newMealPlan = {
            user_id: userId,
            date: new Date(date),
            mealPlan,
            forFamily
        };

        // Lưu vào Redis
        await saveMealPlanToRedis(redis, userId, date, newMealPlan);

        res.json({ success: true, data: newMealPlan });
    } catch (error) {
        console.error('Error generating meal plan:', error);
        res.status(500).json({ error: 'Lỗi tạo thực đơn', details: error.message });
    }
};

// Tìm món tương tự
const findSimilarMeals = async (req, res) => {
    try {
        const { mealId } = req.params;
        
        // Lấy thông tin món ăn hiện tại
        const currentMeal = await axios.get(`${process.env.RECIPE_SERVICE_URL}/${mealId}`, {
            headers: { 'x-api-key': process.env.API_KEY }
        });

        // Lấy tất cả món ăn
        const allMeals = await fetchAllMeals();
        
        // Sử dụng AI để tìm món tương tự
        const prompt = `
        Tìm 5 món ăn tương tự với món: ${JSON.stringify(currentMeal.data)}
        Từ danh sách: ${JSON.stringify(allMeals)}
        
        Tiêu chí: cùng loại (breakfast/lunch/dinner), tương tự ingredients, cooking method
        
        Trả về JSON array của meal_id: ["id1", "id2", "id3", "id4", "id5"]
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const similarMealIds = JSON.parse(response.text());

        // Lấy thông tin chi tiết của các món tương tự
        const similarMeals = allMeals.filter(meal => similarMealIds.includes(meal._id));

        res.json({ success: true, data: similarMeals });
    } catch (error) {
        console.error('Error finding similar meals:', error);
        res.status(500).json({ error: 'Lỗi tìm món tương tự', details: error.message });
    }
};

// Đổi món trong thực đơn
const replaceMeal = async (req, res) => {
    try {
        const { date, servingTime, oldMealId, newMealId, portionSize } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Lấy meal plan từ Redis
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
        }

        // Tìm và đổi món
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({ error: 'Không tìm thấy bữa ăn' });
        }

        const mealIndex = mealSection.meals.findIndex(meal => meal.meal_id.toString() === oldMealId);
        if (mealIndex === -1) {
            return res.status(404).json({ error: 'Không tìm thấy món ăn' });
        }

        // Thay thế món ăn
        mealSection.meals[mealIndex] = {
            meal_id: newMealId,
            isEaten: false,
            portionSize: portionSize || mealSection.meals[mealIndex].portionSize
        };

        // Cập nhật Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        res.json({ success: true, data: mealPlan });
    } catch (error) {
        console.error('Error replacing meal:', error);
        res.status(500).json({ error: 'Lỗi đổi món', details: error.message });
    }
};

// Xóa món khỏi thực đơn
const removeMeal = async (req, res) => {
    try {
        const { date, servingTime, mealId } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Lấy meal plan từ Redis
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlan) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn' });
        }

        // Tìm và xóa món
        const mealSection = mealPlan.mealPlan.find(mp => mp.servingTime === servingTime);
        if (!mealSection) {
            return res.status(404).json({ error: 'Không tìm thấy bữa ăn' });
        }

        mealSection.meals = mealSection.meals.filter(meal => meal.meal_id.toString() !== mealId);

        // Cập nhật Redis
        await saveMealPlanToRedis(redis, userId, date, mealPlan);

        res.json({ success: true, data: mealPlan });
    } catch (error) {
        console.error('Error removing meal:', error);
        res.status(500).json({ error: 'Lỗi xóa món', details: error.message });
    }
};

// Lưu thực đơn vào database
const saveMealPlan = async (req, res) => {
    try {
        const { date } = req.body;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Lấy meal plan từ Redis
        const mealPlanData = await getMealPlanFromRedis(redis, userId, date);
        if (!mealPlanData) {
            return res.status(404).json({ error: 'Không tìm thấy thực đơn trong cache' });
        }

        // Kiểm tra xem đã có meal plan cho ngày này chưa
        const existingMealPlan = await MealPlan.findOne({ 
            user_id: userId, 
            date: new Date(date) 
        });

        if (existingMealPlan) {
            // Cập nhật meal plan hiện có
            await MealPlan.updateOne(
                { user_id: userId, date: new Date(date) },
                { $set: mealPlanData }
            );
        } else {
            // Tạo meal plan mới
            const newMealPlan = new MealPlan(mealPlanData);
            await newMealPlan.save();
        }

        res.json({ success: true, message: 'Lưu thực đơn thành công' });
    } catch (error) {
        console.error('Error saving meal plan:', error);
        res.status(500).json({ error: 'Lỗi lưu thực đơn', details: error.message });
    }
};

// Lấy thực đơn
const getMealPlan = async (req, res) => {
    try {
        const { date } = req.query;
        const userId = req.user_id;
        const redis = req.app.locals.redis;

        // Kiểm tra Redis trước
        let mealPlan = await getMealPlanFromRedis(redis, userId, date);
        
        if (!mealPlan) {
            // Nếu không có trong Redis, tìm trong database
            mealPlan = await MealPlan.findOne({ 
                user_id: userId, 
                date: new Date(date) 
            });

            if (mealPlan) {
                // Lưu lại vào Redis
                await saveMealPlanToRedis(redis, userId, date, mealPlan);
            }
        }

        res.json({ success: true, data: mealPlan });
    } catch (error) {
        console.error('Error getting meal plan:', error);
        res.status(500).json({ error: 'Lỗi lấy thực đơn', details: error.message });
    }
};

module.exports = {
    generateMealPlan,
    findSimilarMeals,
    replaceMeal,
    removeMeal,
    saveMealPlan,
    getMealPlan
};
