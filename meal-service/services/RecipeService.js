const axios = require("axios");
const RECIPE_SERVICE_URL = process.env.RECIPE_SERVICE_URL || "http://localhost:5005/api/recipes";

const getRecipeById = async (recipeId, token = "") => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await axios.get(`${RECIPE_SERVICE_URL}/${recipeId}`, { headers });
    return res.data;
};

const addRecipe = async (recipeData, token = "") => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await axios.post(`${RECIPE_SERVICE_URL}/add-recipe`, recipeData, { headers });
    return res.data;
};

const updateRecipe = async (recipeId, recipeData, token = "") => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await axios.put(`${RECIPE_SERVICE_URL}/update-recipe/${recipeId}`, recipeData, { headers });
    return res.data;
}

module.exports = { getRecipeById, addRecipe, updateRecipe };