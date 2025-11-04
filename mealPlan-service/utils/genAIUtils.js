const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tạo thực đơn đơn giản không dùng AI - chọn random
const generateSimpleMealPlan = (allMeals, forFamily = false) => {
    try {
        const mealsArray = allMeals.data?.meals || [];
        
        if (mealsArray.length === 0) {
            throw new Error('Không có món ăn nào để tạo thực đơn');
        }

        // Chọn random ít nhất 2 món cho mỗi bữa
        const getRandomMealsForTime = (count = 2) => {
            const shuffled = [...mealsArray].sort(() => 0.5 - Math.random());
            return shuffled.slice(0, Math.min(count, mealsArray.length)).map(meal => ({
                meal_id: meal._id,
                portionSize: {
                    amount: forFamily ? 4 : 1,
                    unit: "portion"
                }
            }));
        };

        return {
            breakfast: getRandomMealsForTime(2),
            lunch: getRandomMealsForTime(2),
            dinner: getRandomMealsForTime(2)
        };
    } catch (error) {
        console.error('Error in generateSimpleMealPlan:', error);
        throw new Error('Lỗi tạo thực đơn: ' + error.message);
    }
};

// AI tạo thực đơn - COMMENTED OUT
/*
const generateMealPlanWithAI = async (date, forFamily, preferences, allMeals) => {
    try {
        const prompt = `
        Bạn là một chuyên gia dinh dưỡng. Tạo thực đơn cho ${forFamily ? 'gia đình 4 người' : 'cá nhân'} cho ngày ${date}.
        
        Yêu cầu:
        - Cân bằng dinh dưỡng (protein, carb, chất béo, vitamin, khoáng chất)
        - Đa dạng món ăn
        - Phù hợp với văn hóa ẩm thực Việt Nam
        - Khẩu phần ăn hợp lý
        
        Sở thích: ${JSON.stringify(preferences)}
        
        Chọn từ danh sách món ăn sau (chỉ chọn những món có trong danh sách): 
        ${JSON.stringify(allMeals.slice(0, 100).map(meal => ({
            _id: meal._id,
            name: meal.name,
            category: meal.category,
            nutrition: meal.nutrition
        })))}
        
        Trả về JSON format chính xác như sau (không thêm text gì khác):
        {
            "breakfast": [{"meal_id": "id_thực_tế", "portionSize": {"amount": số_thực, "unit": "gram|portion|piece"}}],
            "lunch": [{"meal_id": "id_thực_tế", "portionSize": {"amount": số_thực, "unit": "gram|portion|piece"}}],
            "dinner": [{"meal_id": "id_thực_tế", "portionSize": {"amount": số_thực, "unit": "gram|portion|piece"}}]
        }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean response text để đảm bảo parse JSON thành công
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error in generateMealPlanWithAI:', error);
        throw new Error('Lỗi tạo thực đơn với AI: ' + error.message);
    }
};
*/

// AI tìm món tương tự - COMMENTED OUT
/*
const findSimilarMealsWithAI = async (currentMeal, allMeals) => {
    try {
        const prompt = `
        Bạn là chuyên gia ẩm thực. Tìm 5 món ăn tương tự nhất với món ăn sau:
        Món hiện tại: ${JSON.stringify({
            name: currentMeal.name,
            category: currentMeal.category,
            ingredients: currentMeal.ingredients,
            cookingMethod: currentMeal.cookingMethod,
            nutrition: currentMeal.nutrition
        })}
        
        Từ danh sách món ăn:
        ${JSON.stringify(allMeals.slice(0, 200).map(meal => ({
            _id: meal._id,
            name: meal.name,
            category: meal.category,
            ingredients: meal.ingredients,
            cookingMethod: meal.cookingMethod,
            nutrition: meal.nutrition
        })))}
        
        Tiêu chí tương tự:
        1. Cùng category hoặc phù hợp cho cùng bữa ăn
        2. Tương tự ingredients chính
        3. Tương tự cooking method
        4. Tương tự nutrition profile
        5. Phù hợp thay thế trong thực đơn
        
        Trả về JSON array chỉ chứa meal_id (không thêm text gì khác):
        ["id1", "id2", "id3", "id4", "id5"]
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean response text
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error in findSimilarMealsWithAI:', error);
        throw new Error('Lỗi tìm món tương tự với AI: ' + error.message);
    }
};
*/

// AI đề xuất khẩu phần phù hợp - COMMENTED OUT
/*
const suggestPortionSize = async (mealInfo, forFamily, userPreferences = {}) => {
    try {
        const prompt = `
        Đề xuất khẩu phần phù hợp cho món ăn:
        Món ăn: ${JSON.stringify(mealInfo)}
        Đối tượng: ${forFamily ? 'Gia đình 4 người (2 người lớn, 2 trẻ em)' : 'Cá nhân'}
        Sở thích: ${JSON.stringify(userPreferences)}
        
        Trả về JSON format:
        {
            "amount": số_thực,
            "unit": "gram|portion|piece|ml"
        }
        `;

        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const cleanText = text.replace(/```json|```/g, '').trim();
        return JSON.parse(cleanText);
    } catch (error) {
        console.error('Error in suggestPortionSize:', error);
        // Return default portion size if AI fails
        return {
            amount: forFamily ? 4 : 1,
            unit: "portion"
        };
    }
};
*/

module.exports = {
    generateSimpleMealPlan
    // generateMealPlanWithAI, // commented out
    // findSimilarMealsWithAI, // commented out
    // suggestPortionSize // commented out
};
