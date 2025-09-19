// ingredientService.js
const axios = require("axios");

const INGREDIENT_SERVICE_URL = "http://ingredient-service:5002/api/ingredient";

const getIngredientById = async (ingredientId) => {
    const res = await axios.get(`${INGREDIENT_SERVICE_URL}/${ingredientId}`);
    return res.data;
};

const getIngredientsByIds = async (ids = []) => {
    const res = await axios.post(`${INGREDIENT_SERVICE_URL}/batch`, { ids });
    return res.data;
};

module.exports = { getIngredientById, getIngredientsByIds };
