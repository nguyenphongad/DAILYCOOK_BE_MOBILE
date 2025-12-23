const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Khởi tạo Google Generative AI SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function gọi Gemini API bằng SDK
const callGeminiAPI = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ 
            model: process.env.GEMINI_MODEL,
            generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        });

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        if (!text) {
            throw new Error('No text in Gemini API response');
        }

        return text;
    } catch (error) {
        console.error('Gemini SDK Error:', error.message);
        throw error;
    }
};

// Initialize Gemini AI
const genAIUtils = {
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

        const model = genAIUtils.getGenerativeModel({ 
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
        1. Chỉ chọn 1 danh mục món ăn phù hợp nhất cho BỮA SÁNG (tức buổi sáng chỉ một món)
        2. Chọn 1-4 danh mục món ăn phù hợp nhất cho BỮA TRƯA
        3. Chọn 1-4 danh mục món ăn phù hợp nhất cho BỮA TỐI
        4. Các món ăn cùng một bữa không nằm cùng danh mục, giả sử không thể có 2 canh trong một bữa 
        5. Nhớ rằng mỗi bữa ăn sáng hoặc trưa hay tối không có món nào trùng nhau
        6. Dựa trên chế độ ăn ${dietaryPreferences?.DietType_id}, mục tiêu calories ${nutritionGoals?.caloriesPerDay} kcal
        7. Tránh danh mục có nguyên liệu dị ứng hoặc không thích

        **OUTPUT JSON (không thêm text khác):**
        {
            "breakfast": ["category_id_1"],
            "lunch": ["category_id_1", "category_id_2"],
            "dinner": ["category_id_1", "category_id_2"],
            "reasoning": "Giải thích ngắn gọn lý do chọn"
        }
        `;

        // Gọi Gemini API qua SDK
        const text = await callGeminiAPI(prompt);
        
        // Parse JSON response
        const parsedResponse = JSON.parse(text);
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
        
        const numMeals = servingTime.toLowerCase() === 'breakfast' ? 1 : 2;
        const mealRange = servingTime.toLowerCase() === 'breakfast' ? '1 món' : '2-3 món';
        
        const mealRequirements = servingTime.toLowerCase() === 'breakfast' 
            ? 'Chọn 1 món đủ dinh dưỡng, có thể là món chính hoặc món ăn sáng nhẹ'
            : `
**YÊU CẦU BỔ SUNG CHO BỮA ${servingTime.toUpperCase()}:**
- Trong 2-3 món, BẮT BUỘC phải có ít nhất 1 MÓN CHÍNH (món có thịt/cá/tôm)
- Món chính nên là: món kho (thịt kho, cá kho), món chiên (gà chiên, cá chiên), món xào có thịt
- Các món còn lại có thể là: canh, rau xào, món phụ
- TUYỆT ĐỐI KHÔNG chọn toàn món canh hoặc toàn món rau
- Ưu tiên cân bằng: 1 món chính + 1 món canh/rau`;
        
        const prompt = `
Bạn là chuyên gia dinh dưỡng. Chọn ${mealRange} phù hợp cho BỮA ${servingTime.toUpperCase()}.

**YÊU CẦU CƠ BẢN:**
- Calories mục tiêu cho bữa này: ~${Math.round(targetCalories / 3)} kcal
- Chế độ ăn: ${dietaryPreferences?.DietType_id}
- Protein: ${nutritionGoals?.proteinPercentage}%
- Carbs: ${nutritionGoals?.carbPercentage}%
- Fat: ${nutritionGoals?.fatPercentage}%
${mealRequirements}

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
        {"meal_id": "id_thực_tế"}${servingTime.toLowerCase() !== 'breakfast' ? `,
        {"meal_id": "id_thực_tế"}` : ''}
    ]
}
`;

        // Gọi Gemini API qua SDK
        const text = await callGeminiAPI(prompt);
        const parsedResponse = JSON.parse(text);
        return parsedResponse.selectedMeals || [];
        
    } catch (error) {
        console.error(`Error selecting meals for ${servingTime}:`, error);
        const numMeals = servingTime.toLowerCase() === 'breakfast' ? 1 : 2;
        const shuffled = meals.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numMeals).map(m => ({ meal_id: m._id }));
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

        // Gọi Gemini API qua SDK
        const text = await callGeminiAPI(prompt);
        const parsedResponse = JSON.parse(text);
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

// Fallback meal selection khi AI lỗi
const getFallbackMealsByCategory = async ({ servingTime, mealCategories, getMealsByCategoryFn, token, isFamily }) => {
    try {
        // Định nghĩa danh mục ID cho từng bữa ăn (dựa trên data thực tế)
        const categoryMapping = {
            breakfast: [
                '69427f553f8654bb5b6c2b6c', // Các loại bánh
                '69427f0c3f8654bb5b6c2b5a', // Bánh đa, bún, phở
                '69427efc3f8654bb5b6c2b57', // Bánh canh, hủ tiếu, miến, mỳ
                '69427f173f8654bb5b6c2b5d', // Cơm, cháo, xôi
                '69427f233f8654bb5b6c2b60', // Burger, pizza
                '69427f3e3f8654bb5b6c2b66', // Giải khát
                '69427f323f8654bb5b6c2b63'  // Chè, các loại giải khát
            ],
            lunch: [
                '69427ece3f8654bb5b6c2b4e', // Cơm các loại
                '69427f173f8654bb5b6c2b5d', // Cơm, cháo, xôi
                '69427f5e3f8654bb5b6c2b6f', // Các món khác
                '6944520c3ff1cb9255d2c89f', // Món canh
                '69427f483f8654bb5b6c2b69', // Ngao, ốc
                '69427f3e3f8654bb5b6c2b66'  // Giải khát
            ],
            dinner: [
                '69427ece3f8654bb5b6c2b4e', // Cơm các loại
                '69427eea3f8654bb5b6c2b54', // Bún, cơm, xôi, cháo
                '69427efc3f8654bb5b6c2b57', // Bánh canh, hủ tiếu, miến, mỳ
                '6944520c3ff1cb9255d2c89f', // Món canh
                '69427f483f8654bb5b6c2b69', // Ngao, ốc
                '69427f3e3f8654bb5b6c2b66'  // Giải khát
            ]
        };

        const requiredCategoryIds = categoryMapping[servingTime] || [];

        // ✅ FIX: Convert ObjectId sang String trước khi so sánh
        const matchedCategories = mealCategories.filter(cat => 
            requiredCategoryIds.includes(cat._id.toString())
        );

        console.log(`📋 Tìm thấy ${matchedCategories.length} danh mục phù hợp cho ${servingTime}`);

        // ✅ Xác định số lượng món: breakfast = 1, lunch/dinner = 2-4
        let numMeals;
        if (servingTime === 'breakfast') {
            numMeals = isFamily ? 3 : 1;
        } else {
            // Lunch và Dinner: random từ 2-4 món
            const baseNum = Math.floor(Math.random() * 3) + 2; // Random 2, 3, hoặc 4
            numMeals = isFamily ? baseNum * 2 : baseNum; // Nếu family thì gấp đôi
        }

        console.log(`🎲 Số món cần lấy: ${numMeals}`);

        // ============= RANDOM DANH MỤC BAN ĐẦU =============
        const shuffledCategories = [...matchedCategories].sort(() => Math.random() - 0.5);

        // ============= LẤY MÓN TỪ CÁC DANH MỤC CHO ĐẾN KHI ĐỦ =============
        let collectedMeals = [];
        let attemptedCategories = new Set();

        for (const category of shuffledCategories) {
            // Nếu đã đủ món thì dừng
            if (collectedMeals.length >= numMeals) break;

            // ✅ FIX: Convert ObjectId sang String khi lưu vào Set
            attemptedCategories.add(category._id.toString());

            try {
                console.log(`🔍 Đang lấy món từ danh mục: ${category.title}`);
                const mealsResponse = await getMealsByCategoryFn(category._id, token, 50);
                const meals = mealsResponse.data?.meals || [];

                if (meals.length > 0) {
                    console.log(`✓ Tìm thấy ${meals.length} món từ danh mục ${category.title}`);
                    collectedMeals.push(...meals.map(m => ({ ...m, categoryTitle: category.title })));
                } else {
                    console.log(`⚠️  Danh mục ${category.title} không có món, tiếp tục tìm...`);
                }
            } catch (error) {
                console.warn(`⚠️  Lỗi khi lấy món từ category ${category.title}:`, error.message);
            }
        }

        // ============= NẾU VẪN CHƯA ĐỦ MÓN, LẤY TỪ TẤT CẢ DANH MỤC KHÁC =============
        if (collectedMeals.length < numMeals) {
            console.log(`⚠️  Chỉ có ${collectedMeals.length}/${numMeals} món, tìm thêm từ các danh mục khác...`);

            // ✅ FIX: Convert ObjectId sang String khi filter
            const remainingCategories = mealCategories
                .filter(cat => !attemptedCategories.has(cat._id.toString()))
                .sort(() => Math.random() - 0.5); // Random

            for (const category of remainingCategories) {
                if (collectedMeals.length >= numMeals) break;

                try {
                    console.log(`🔍 Đang lấy món từ danh mục dự phòng: ${category.title}`);
                    const mealsResponse = await getMealsByCategoryFn(category._id, token, 50);
                    const meals = mealsResponse.data?.meals || [];

                    if (meals.length > 0) {
                        console.log(`✓ Tìm thấy ${meals.length} món từ danh mục ${category.title}`);
                        collectedMeals.push(...meals.map(m => ({ ...m, categoryTitle: category.title })));
                    }
                } catch (error) {
                    console.warn(`⚠️  Lỗi khi lấy món từ category ${category.title}:`, error.message);
                }
            }
        }

        // ============= KIỂM TRA CÓ ĐỦ MÓN KHÔNG =============
        if (collectedMeals.length === 0) {
            throw new Error(`Không tìm thấy món nào cho ${servingTime} sau khi thử tất cả danh mục`);
        }

        console.log(`📦 Tổng cộng thu thập được ${collectedMeals.length} món`);

        // ============= RANDOM CHỌN MÓN =============
        const shuffledMeals = collectedMeals.sort(() => Math.random() - 0.5);
        const finalMeals = shuffledMeals.slice(0, Math.min(numMeals, shuffledMeals.length));

        console.log(`✅ Đã chọn ${finalMeals.length} món cho ${servingTime}`);

        return finalMeals.map(meal => ({
            meal_id: meal._id,
            reason: `Được chọn từ danh mục: ${meal.categoryTitle}`
        }));

    } catch (error) {
        console.error(`❌ Lỗi getFallbackMealsByCategory cho ${servingTime}:`, error);
        throw error;
    }
};

module.exports = {
    generateSimpleMealPlan,
    generateAIBasedMealPlan,
    analyzeDietaryNeedsWithAI,
    selectMealsWithAI,
    selectSimilarMealsWithAI,
    callGeminiAPI,
    getFallbackMealsByCategory
};
