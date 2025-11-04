const axios = require('axios');

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
const authServiceClient = createApiClient('http://localhost:5000/api/auth');
const mealServiceClient = createApiClient('http://localhost:5000/api/meals');
const ingredientServiceClient = createApiClient('http://localhost:5000/api/ingredients');
const recipeServiceClient = createApiClient('http://localhost:5000/api/recipes');

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

// Lấy tất cả meals
const getAllMeals = async () => {
    try {
        const response = await mealServiceClient.get('/');
        return response.data;
    } catch (error) {
        handleApiError(error, 'Meal Service');
    }
};

// ==================== RECIPE SERVICE APIs ====================

// Lấy recipe theo ID
const getRecipeById = async (recipeId) => {
    try {
        const response = await recipeServiceClient.get(`/${recipeId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Recipe Service');
    }
};

// ==================== INGREDIENT SERVICE APIs ====================

// Lấy ingredient theo ID
const getIngredientById = async (ingredientId) => {
    try {
        const response = await ingredientServiceClient.get(`/ingredient/${ingredientId}`);
        return response.data;
    } catch (error) {
        handleApiError(error, 'Ingredient Service');
    }
};

// ==================== UTILITY FUNCTIONS ====================

// Lấy chi tiết đầy đủ của meal (bao gồm recipe và ingredients)
const getMealWithFullDetails = async (meal) => {
    try {
        // Lấy chi tiết recipe
        let recipeDetail = null;
        if (meal.recipe && meal.recipe.recipe_id) {
            const recipeResponse = await getRecipeById(meal.recipe.recipe_id);
            recipeDetail = recipeResponse.data;
        }

        // Lấy chi tiết ingredients
        const ingredientDetails = [];
        if (meal.ingredients && meal.ingredients.length > 0) {
            for (const ingredient of meal.ingredients) {
                try {
                    const ingredientResponse = await getIngredientById(ingredient.ingredient_id);
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

// Lấy nhiều meals với chi tiết đầy đủ
const getMultipleMealsWithDetails = async (meals) => {
    const detailedMeals = [];
    
    for (const meal of meals) {
        const detailedMeal = await getMealWithFullDetails(meal);
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
    
    // Recipe Service APIs
    getRecipeById,
    
    // Ingredient Service APIs
    getIngredientById,
    
    // Utility Functions
    getMealWithFullDetails,
    getMultipleMealsWithDetails,
    getRandomMeals,
    checkServiceHealth,
    
    // Error handler for external use
    handleApiError
};
