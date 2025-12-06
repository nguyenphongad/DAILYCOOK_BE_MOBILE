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

// AI tạo thực đơn dựa trên user profile và dietary preferences
const generateAIBasedMealPlan = async ({ date, forFamily, userProfile, allMeals }) => {
    try {
        const { personalInfo = {}, dietaryPreferences = {}, nutritionGoals = {}, familyInfo = {} } = userProfile;

        // Lọc món ăn loại bỏ allergies và dislike ingredients
        const allergies = dietaryPreferences.allergies || [];
        const dislikeIngredients = dietaryPreferences.dislikeIngredients || [];
        
        const filteredMeals = allMeals.filter(meal => {
            if (!meal.ingredients) return true;
            
            // Kiểm tra có chứa nguyên liệu dị ứng hoặc không thích
            const hasAllergen = meal.ingredients.some(ing => 
                allergies.includes(ing.ingredient_id) || 
                allergies.includes(ing.name)
            );
            
            const hasDisliked = meal.ingredients.some(ing => 
                dislikeIngredients.includes(ing.ingredient_id) || 
                dislikeIngredients.includes(ing.name)
            );
            
            return !hasAllergen && !hasDisliked;
        });

        if (filteredMeals.length < 6) {
            throw new Error('Không đủ món ăn phù hợp sau khi lọc. Vui lòng cập nhật sở thích.');
        }

        // Tính số người ăn
        const totalPeople = forFamily 
            ? (familyInfo.adults || 2) + (familyInfo.children || 0) + (familyInfo.teenagers || 0) + (familyInfo.elderly || 0)
            : 1;

        // Tạo prompt cho Gemini AI
        const prompt = `
Bạn là chuyên gia dinh dưỡng chuyên nghiệp. Tạo thực đơn cho ngày ${date}.

**THÔNG TIN:**
- Đối tượng: ${forFamily ? `Gia đình ${totalPeople} người` : 'Cá nhân'}
${personalInfo.height ? `- Chiều cao: ${personalInfo.height} cm` : ''}
${personalInfo.weight ? `- Cân nặng: ${personalInfo.weight} kg` : ''}
${personalInfo.age ? `- Tuổi: ${personalInfo.age}` : ''}
${personalInfo.gender ? `- Giới tính: ${personalInfo.gender}` : ''}
- Chế độ ăn: ${dietaryPreferences.DietType_id || 'Bình thường'}
${nutritionGoals.caloriesPerDay ? `- Calories mục tiêu: ${nutritionGoals.caloriesPerDay} kcal/ngày` : ''}

**YÊU CẦU:**
1. Cân bằng dinh dưỡng
2. Đa dạng món ăn
3. Phù hợp văn hóa Việt Nam
4. Khẩu phần: ${totalPeople} người

**MÓN ĂN CÓ SẴN (đã lọc dị ứng & không thích):**
${JSON.stringify(filteredMeals.slice(0, 50).map(meal => ({
    _id: meal._id,
    name: meal.name,
    category: meal.mealCategory,
    calories: meal.nutrition?.calories
})), null, 2)}

**OUTPUT JSON (không thêm text khác):**
{
    "breakfast": [
        {"meal_id": "id_thực_tế", "portionSize": {"amount": ${totalPeople}, "unit": "portion"}}
    ],
    "lunch": [
        {"meal_id": "id_thực_tế", "portionSize": {"amount": ${totalPeople}, "unit": "portion"}}
    ],
    "dinner": [
        {"meal_id": "id_thực_tế", "portionSize": {"amount": ${totalPeople}, "unit": "portion"}}
    ]
}

Chọn 2-3 món mỗi bữa từ danh sách trên.`;

        const model = genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
        });
        
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean và parse JSON
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanText = cleanText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        const parsedResponse = JSON.parse(cleanText);
        
        // Validate response
        if (!parsedResponse.breakfast || !parsedResponse.lunch || !parsedResponse.dinner) {
            throw new Error('AI response không đúng format');
        }
        
        // Validate meal_ids tồn tại
        const validateMealIds = (meals) => {
            return meals.every(m => 
                filteredMeals.some(fm => fm._id === m.meal_id)
            );
        };
        
        if (!validateMealIds(parsedResponse.breakfast) || 
            !validateMealIds(parsedResponse.lunch) || 
            !validateMealIds(parsedResponse.dinner)) {
            throw new Error('AI chọn món không có trong danh sách');
        }
        
        return parsedResponse;
    } catch (error) {
        console.error('Error in generateAIBasedMealPlan:', error);
        
        // Fallback: nếu AI fail, dùng random selection
        console.log('Fallback to simple meal plan...');
        const simplePlan = generateSimpleMealPlan({ data: { meals: allMeals } }, forFamily);
        return simplePlan;
    }
};

module.exports = {
    generateSimpleMealPlan,
    generateAIBasedMealPlan
};
