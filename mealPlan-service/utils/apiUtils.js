const axios = require('axios');

// ✅ Thêm API_KEY từ env
const API_KEY = process.env.API_KEY;

// Base configuration for API calls
const createApiClient = (baseURL) => {
    return axios.create({
        baseURL,
        timeout: 10000, // 10 seconds timeout
        headers: {
            'Content-Type': 'application/json'
        }
    });
};

// API clients for different services
const authServiceClient = createApiClient(process.env.AUTH_SERVICE_URL );
const mealServiceClient = createApiClient(process.env.MEAL_SERVICE_URL );
const ingredientServiceClient = createApiClient(process.env.INGREDIENT_SERVICE_URL );
const recipeServiceClient = createApiClient(process.env.RECIPE_SERVICE_URL);
const surveyServiceClient = createApiClient(process.env.SURVEY_SERVICE_URL ); 

// Error handler for API calls
const handleApiError = (error, serviceName) => {
    console.error(`${serviceName} API Error:`, error.response?.data || error.message);
    
    if (error.response) {
        throw new Error(`${serviceName}: ${error.response.data?.message || error.response.statusText}`);
    } else if (error.request) {
        throw new Error(`${serviceName}: Không thể kết nối đến service`);
    } else {
        throw new Error(`${serviceName}: ${error.message}`);
    }
};

// ==================== AUTH SERVICE APIs ====================

// Xác thực token và lấy user info
const verifyUserToken = async (token) => {
    try {
        const response = await authServiceClient.get('/check-token', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Auth Service');
    }
};

// ==================== MEAL SERVICE APIs ====================

// Lấy tất cả meals với token và pagination
const getAllMeals = async (token = null, page = 1, limit = 300) => {
    try {
        const headers = {
            'x-api-key': process.env.API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await mealServiceClient.get(`/?page=${page}&limit=${limit}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// Lấy thông tin Diet Type theo ID
const getDietTypeById = async (dietTypeId, token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await mealServiceClient.get(`/diet-type/${dietTypeId}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// Lấy chi tiết meal theo ID (bao gồm ingredients details)
const getMealDetailById = async (mealId, token = null) => {
    try {
        const headers = {
            'x-api-key': process.env.API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const url = process.env.MEAL_DETAIL_SERVICE_URL.replace(':meal_id', mealId);
        const response = await axios.get(url, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// ==================== RECIPE SERVICE APIs ====================

// Lấy recipe theo ID với token
const getRecipeById = async (recipeId, token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await recipeServiceClient.get(`/${recipeId}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Recipe Service');
    }
};

// ==================== SURVEY SERVICE APIs ====================

// Lấy user profile từ survey service
const getUserProfile = async (userId, token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await surveyServiceClient.get(`/profile/${userId}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Survey Service');
    }
};

// Lấy user full profile từ survey service (bao gồm nutrition goals)
const getUserFullProfile = async (token) => {
    try {
        const headers = {
            'x-api-key': process.env.API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(process.env.SURVEY_PROFILE_URL, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Survey Service');
    }
};

// ==================== INGREDIENT SERVICE APIs ====================

// Lấy ingredient theo ID với token
const getIngredientById = async (ingredientId, token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await ingredientServiceClient.get(`/ingredient/${ingredientId}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Ingredient Service');
    }
};

// Lấy danh sách ingredient categories
const getIngredientCategories = async (token = null) => {
    try {
        const headers = {
            'x-api-key': process.env.API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(`${process.env.INGREDIENT_CATEGORIES_URL}?page=1&limit=200`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Ingredient Service');
    }
};

// ==================== MEAL CATEGORY APIs ====================

// Lấy danh mục món ăn
const getMealCategories = async (token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await mealServiceClient.get('/categories', { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// Lấy danh sách meal categories
const getAllMealCategories = async (token = null) => {
    try {
        const headers = {
            'x-api-key': process.env.API_KEY
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await axios.get(process.env.MEAL_CATEGORIES_URL, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// Lấy món ăn theo danh mục
const getMealsByCategory = async (categoryId, token = null) => {
    try {
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await mealServiceClient.get(`/category/${categoryId}`, { headers });
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// Lấy món ăn theo category với pagination
const getMealsByCategoryWithLimit = async (categoryId, token, limit = 50) => {
    try {
        console.log(`🔍 Query meals with category_id: ${categoryId}, limit: ${limit}`);
        
        // ✅ Sử dụng MEAL_BY_CATEGORY_URL từ env
        const url = process.env.MEAL_BY_CATEGORY_URL.replace(':meal_category_id', categoryId);
        
        const response = await axios.get(url, {
            params: { limit },
            headers: {
                'Authorization': `Bearer ${token}`,
                'x-api-key': API_KEY // ✅ Đã khai báo ở trên
            }
        });
        
        console.log(`✅ Response from Meal Service:`, {
            status: response.status,
            mealsCount: response.data?.data?.meals?.length || 0
        });
        
        return response.data;
    } catch (error) {
        console.error(`❌ Error getMealsByCategoryWithLimit (category: ${categoryId}):`, {
            message: error.message,
            status: error.response?.status
        });
        throw error;
    }
};

// ==================== UTILITY FUNCTIONS ====================

// Lấy chi tiết đầy đủ của meal (bao gồm recipe và ingredients) với token
const getMealWithFullDetails = async (meal, token = null) => {
    try {
        // Lấy chi tiết recipe
        let recipeDetail = null;
        if (meal.recipe && meal.recipe.recipe_id) {
            const recipeResponse = await getRecipeById(meal.recipe.recipe_id, token);
            recipeDetail = recipeResponse.data;
        }

        // Lấy chi tiết ingredients
        const ingredientDetails = [];
        if (meal.ingredients && meal.ingredients.length > 0) {
            for (const ingredient of meal.ingredients) {
                try {
                    const ingredientResponse = await getIngredientById(ingredient.ingredient_id, token);
                    ingredientDetails.push({
                        ...ingredient,
                        detail: ingredientResponse.data
                    });
                } catch (error) {
                    console.error(`Error fetching ingredient ${ingredient.ingredient_id}:`, error.message);
                    ingredientDetails.push({
                        ...ingredient,
                        detail: null
                    });
                }
            }
        }

        return {
            ...meal,
            recipeDetail,
            ingredientDetails
        };
    } catch (error) {
        console.error('Error getting meal with full details:', error);
        return meal;
    }
};

// Lấy nhiều meals với chi tiết đầy đủ với token
const getMultipleMealsWithDetails = async (meals, token = null) => {
    const detailedMeals = [];
    
    for (const meal of meals) {
        const detailedMeal = await getMealWithFullDetails(meal, token);
        detailedMeals.push(detailedMeal);
    }
    
    return detailedMeals;
};

// Chọn random meals từ danh sách
const getRandomMeals = (meals, count = 2) => {
    const shuffled = meals.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Check service health
const checkServiceHealth = async (serviceName, serviceUrl) => {
    try {
        const client = createApiClient(serviceUrl);
        const response = await client.get('/health');
        return { service: serviceName, status: 'healthy', data: response.data };
    } catch (error) {
        return { service: serviceName, status: 'unhealthy', error: error.message };
    }
};

module.exports = {
    // Auth Service APIs
    verifyUserToken,
    
    // Meal Service APIs
    getAllMeals,
    getMealCategories,
    getAllMealCategories,
    getMealsByCategory,
    getMealsByCategoryWithLimit,
    getDietTypeById,
    getMealDetailById, // Export function mới
    
    // Recipe Service APIs
    getRecipeById,
    
    // Ingredient Service APIs
    getIngredientById,
    getIngredientCategories,
    
    // Survey Service APIs
    getUserProfile,
    getUserFullProfile,
    
    // Utility Functions
    getMealWithFullDetails,
    getMultipleMealsWithDetails,
    getRandomMeals,
    checkServiceHealth,
    
    // Error handler for external use
    handleApiError
};
