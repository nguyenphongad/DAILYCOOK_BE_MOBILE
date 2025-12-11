const axios = require('axios');

// Helper function gọi Gemini API bằng fetch/axios
const callGeminiAPI = async (prompt) => {
    try {
        const apiUrl = `${process.env.GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`;
        
        const response = await axios.post(apiUrl, {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 30000 // 30 seconds
        });

        // Extract text từ response
        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        
        if (!text) {
            throw new Error('No text in Gemini API response');
        }

        return text;
    } catch (error) {
        console.error('Gemini API Error:', error.response?.data || error.message);
        throw error;
    }
};

// Initialize Gemini AI
const genAI = {
    getGenerativeModel: ({ model }) => {
        return {
            generateContent: async (prompt) => {
                // Gọi Gemini API
                const text = await callGeminiAPI(prompt);
                
                return {
                    response: {
                        text: () => text
                    }
                };
            }
        };
    }
};

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

// AI phân tích user profile và gợi ý meal categories
const analyzeDietaryNeedsWithAI = async ({ userProfile, ingredientCategories, mealCategories }) => {
    try {
        // Validate mealCategories là mảng
        if (!Array.isArray(mealCategories)) {
            console.error('mealCategories is not an array:', typeof mealCategories);
            throw new Error('mealCategories phải là mảng');
        }

        const { personalInfo, dietaryPreferences, nutritionGoals, isFamily, familyInfo } = userProfile;
        
        const prompt = `
        Bạn là chuyên gia dinh dưỡng AI. Phân tích thông tin người dùng và gợi ý danh mục món ăn phù hợp.

        **THÔNG TIN NGƯỜI DÙNG:**
        - Loại hồ sơ: ${isFamily ? 'Gia đình' : 'Cá nhân'}
        ${!isFamily ? `
        - Chiều cao: ${personalInfo?.height || 'N/A'} cm
        - Cân nặng: ${personalInfo?.weight || 'N/A'} kg
        - Tuổi: ${personalInfo?.age || 'N/A'}
        - Giới tính: ${personalInfo?.gender || 'N/A'}
        ` : `
        - Số người: ${(familyInfo?.children || 0) + (familyInfo?.teenagers || 0) + (familyInfo?.adults || 0) + (familyInfo?.elderly || 0)}
        `}
        - Chế độ ăn: ${dietaryPreferences?.DietType_id || 'N/A'}
        - Calories mục tiêu: ${nutritionGoals?.caloriesPerDay || 'N/A'} kcal
        - Protein: ${nutritionGoals?.proteinPercentage || 'N/A'}%
        - Carbs: ${nutritionGoals?.carbPercentage || 'N/A'}%
        - Fat: ${nutritionGoals?.fatPercentage || 'N/A'}%
        - Dị ứng: ${dietaryPreferences?.allergies?.join(', ') || 'Không'}
        - Không thích: ${dietaryPreferences?.dislikeIngredients?.join(', ') || 'Không'}

        **DANH MỤC MÓN ĂN CÓ SẴN:**
        ${JSON.stringify(mealCategories.map(cat => ({
            _id: cat._id,
            keyword: cat.keyword,
            title: cat.title,
            description: cat.description
        })), null, 2)}

        **YÊU CẦU:**
        1. Chọn 1-2 danh mục món ăn phù hợp nhất cho BỮA SÁNG
        2. Chọn 1-2 danh mục món ăn phù hợp nhất cho BỮA TRƯA
        3. Chọn 1-2 danh mục món ăn phù hợp nhất cho BỮA TỐI
        4. Dựa trên chế độ ăn ${dietaryPreferences?.DietType_id}, mục tiêu calories ${nutritionGoals?.caloriesPerDay} kcal
        5. Tránh danh mục có nguyên liệu dị ứng hoặc không thích

        **OUTPUT JSON (không thêm text khác):**
        {
            "breakfast": ["category_id_1", "category_id_2"],
            "lunch": ["category_id_1", "category_id_2"],
            "dinner": ["category_id_1", "category_id_2"],
            "reasoning": "Giải thích ngắn gọn lý do chọn"
        }
        `;

        // Gọi Gemini API
        const text = await callGeminiAPI(prompt);
        
        // Clean và parse JSON
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanText = cleanText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        const parsedResponse = JSON.parse(cleanText);
        return parsedResponse;
        
    } catch (error) {
        console.error('Error in analyzeDietaryNeedsWithAI:', error);
        
        // Fallback: chọn danh mục phổ biến
        const fallbackCategories = {
            breakfast: [],
            lunch: [],
            dinner: [],
            reasoning: "Sử dụng danh mục mặc định do lỗi AI"
        };

        if (Array.isArray(mealCategories) && mealCategories.length > 0) {
            const breakfastCat = mealCategories.find(c => c.keyword?.toUpperCase() === 'BREAKFAST');
            const mainDishCat = mealCategories.find(c => c.keyword?.toUpperCase() === 'MAIN_DISH');
            
            if (breakfastCat) fallbackCategories.breakfast.push(breakfastCat._id);
            if (mainDishCat) {
                fallbackCategories.lunch.push(mainDishCat._id);
                fallbackCategories.dinner.push(mainDishCat._id);
            }
            
            if (fallbackCategories.breakfast.length === 0) {
                fallbackCategories.breakfast.push(mealCategories[0]._id);
            }
            if (fallbackCategories.lunch.length === 0) {
                fallbackCategories.lunch.push(mealCategories[Math.min(1, mealCategories.length - 1)]._id);
            }
            if (fallbackCategories.dinner.length === 0) {
                fallbackCategories.dinner.push(mealCategories[Math.min(2, mealCategories.length - 1)]._id);
            }
        }
        
        return fallbackCategories;
    }
};

// AI chọn món ăn cụ thể từ danh sách món
const selectMealsWithAI = async ({ servingTime, meals, userProfile, targetCalories }) => {
    try {
        const { dietaryPreferences, nutritionGoals } = userProfile;
        
        const prompt = `
Bạn là chuyên gia dinh dưỡng. Chọn 2-3 món ăn phù hợp cho BỮA ${servingTime.toUpperCase()}.

**YÊU CẦU:**
- Calories mục tiêu cho bữa này: ~${Math.round(targetCalories / 3)} kcal
- Chế độ ăn: ${dietaryPreferences?.DietType_id}
- Protein: ${nutritionGoals?.proteinPercentage}%
- Carbs: ${nutritionGoals?.carbPercentage}%
- Fat: ${nutritionGoals?.fatPercentage}%

**DANH SÁCH MÓN ĂN:**
${JSON.stringify(meals.slice(0, 50).map(meal => ({
    _id: meal._id,
    name: meal.nameMeal,
    description: meal.description,
    popularity: meal.popularity
})), null, 2)}

**OUTPUT JSON (chỉ trả về meal_id):**
{
    "selectedMeals": [
        {"meal_id": "id_thực_tế"},
        {"meal_id": "id_thực_tế"}
    ]
}
`;

        // Gọi Gemini API
        const text = await callGeminiAPI(prompt);
        
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanText = cleanText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        const parsedResponse = JSON.parse(cleanText);
        return parsedResponse.selectedMeals || [];
        
    } catch (error) {
        console.error(`Error selecting meals for ${servingTime}:`, error);
        // Fallback: chọn random 2 món
        const shuffled = meals.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2).map(m => ({ meal_id: m._id }));
    }
};

// AI chọn món ăn tương tự
const selectSimilarMealsWithAI = async ({ currentMeal, allMeals, userProfile }) => {
    try {
        const { dietaryPreferences, nutritionGoals } = userProfile || {};
        
        const prompt = `
Bạn là chuyên gia dinh dưỡng. Chọn 5 món ăn TƯƠNG TỰ với món hiện tại.

**MÓN ĂN HIỆN TẠI:**
- Tên: ${currentMeal.nameMeal || currentMeal.name}
- Mô tả: ${currentMeal.description || 'N/A'}
- Danh mục: ${currentMeal.mealCategory?.title || currentMeal.mealCategory || 'N/A'}

**YÊU CẦU:**
1. Chọn món có hương vị/phong cách nấu tương tự
2. Cùng danh mục hoặc phù hợp cho cùng bữa ăn
3. Dinh dưỡng cân bằng, có thể khác nhau mỗi lần gọi
4. Tránh trùng với món hiện tại
${dietaryPreferences?.DietType_id ? `5. Phù hợp với chế độ ăn: ${dietaryPreferences.DietType_id}` : ''}

**DANH SÁCH MÓN ĂN (${allMeals.length} món):**
${JSON.stringify(allMeals.slice(0, 100).map(meal => ({
    _id: meal._id,
    name: meal.nameMeal || meal.name,
    description: meal.description,
    category: meal.mealCategory?.title || meal.mealCategory,
    popularity: meal.popularity
})), null, 2)}

**OUTPUT JSON (chỉ trả về 5 món):**
{
    "similarMeals": [
        {"meal_id": "id_thực_tế_1", "reason": "Lý do ngắn gọn"},
        {"meal_id": "id_thực_tế_2", "reason": "Lý do ngắn gọn"},
        {"meal_id": "id_thực_tế_3", "reason": "Lý do ngắn gọn"},
        {"meal_id": "id_thực_tế_4", "reason": "Lý do ngắn gọn"},
        {"meal_id": "id_thực_tế_5", "reason": "Lý do ngắn gọn"}
    ]
}
`;

        // Gọi Gemini API
        const text = await callGeminiAPI(prompt);
        
        let cleanText = text.trim();
        cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
        cleanText = cleanText.replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1');
        
        const parsedResponse = JSON.parse(cleanText);
        return parsedResponse.similarMeals || [];
        
    } catch (error) {
        console.error('Error selecting similar meals with AI:', error);
        // Fallback: chọn random 2 món cùng category
        const sameCategoryMeals = allMeals.filter(m => 
            m._id !== currentMeal._id && 
            (m.mealCategory === currentMeal.mealCategory || 
             m.mealCategory?.keyword === currentMeal.mealCategory?.keyword)
        );
        
        if (sameCategoryMeals.length >= 2) {
            const shuffled = sameCategoryMeals.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 2).map(m => ({ 
                meal_id: m._id,
                reason: "Cùng danh mục (fallback)" 
            }));
        } else {
            // Không đủ món cùng category, lấy random
            const otherMeals = allMeals.filter(m => m._id !== currentMeal._id);
            const shuffled = otherMeals.sort(() => 0.5 - Math.random());
            return shuffled.slice(0, 2).map(m => ({ 
                meal_id: m._id,
                reason: "Món tương tự (fallback)" 
            }));
        }
    }
};

module.exports = {
    generateSimpleMealPlan,
    generateAIBasedMealPlan,
    analyzeDietaryNeedsWithAI,
    selectMealsWithAI,
    selectSimilarMealsWithAI, // Export function mới
    callGeminiAPI // Export để test
};
