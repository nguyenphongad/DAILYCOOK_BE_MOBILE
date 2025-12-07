const axios = require("axios");

// Đọc từ env và log ra để debug
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL;

// Log ngay khi service khởi động
console.log("=== RECIPE SERVICE CONFIG ===");
console.log("RECIPE_SERVICE_URL:", RECIPE_SERVICE_URL);
console.log("Environment:", process.env.NODE_ENV || 'development');

const getRecipeById = async (recipeId, token = "") => {
    if (!RECIPE_SERVICE_URL) {
        const error = new Error("RECIPE_SERVICE_URL is not defined in environment variables. Please add it to .env file");
        console.error(error.message);
        throw error;
    }
    
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const url = `${RECIPE_SERVICE_URL}/${recipeId}`;
    console.log("Getting recipe from:", url);
    
    const res = await axios.get(url, { headers });
    return res.data;
};

const addRecipe = async (recipeData, token = "") => {
    if (!RECIPE_SERVICE_URL) {
        const error = new Error("RECIPE_SERVICE_URL is not defined in environment variables. Please add it to .env file");
        console.error(error.message);
        throw error;
    }
    
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const url = `${RECIPE_SERVICE_URL}/add-recipe`;
    console.log("Adding recipe to:", url);
    
    const res = await axios.post(url, recipeData, { headers });
    return res.data;
};

const updateRecipe = async (recipeId, recipeData, token = "") => {
    if (!RECIPE_SERVICE_URL) {
        const error = new Error("RECIPE_SERVICE_URL is not defined in environment variables. Please add it to .env file");
        console.error(error.message);
        throw error;
    }
    
    if (!recipeId) {
        throw new Error("Recipe ID is required for update");
    }
    
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    
    const url = `${RECIPE_SERVICE_URL}/update-recipe/${recipeId}`;
    console.log("Updating recipe at:", url);
    console.log("Recipe data:", JSON.stringify(recipeData, null, 2));
    
    const res = await axios.put(url, recipeData, { headers });
    console.log("Update recipe response:", res.data);
    return res.data;
}

module.exports = { getRecipeById, addRecipe, updateRecipe };