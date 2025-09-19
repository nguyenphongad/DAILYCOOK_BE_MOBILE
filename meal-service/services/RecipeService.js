// recipeService.js
const axios = require("axios");

const RECIPE_SERVICE_URL = "http://recipe-service:5005/api/recipes";

const getRecipeById = async (recipeId) => {
    const res = await axios.get(`${RECIPE_SERVICE_URL}/${recipeId}`);
    return res.data;
};

const addRecipe = async (recipeData) => {
    const res = await axios.post(`${RECIPE_SERVICE_URL}/add-recipe`, recipeData);
    return res.data;
};

// const getRecipesByIds = async (ids = []) => {
//     const res = await axios.post(`${RECIPE_SERVICE_URL}/batch`, { ids });
//     return res.data;
// };

module.exports = { getRecipeById, addRecipe };
