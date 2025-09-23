const axios = require("axios");
const INGREDIENT_SERVICE_URL = process.env.INGREDIENT_SERVICE_URL || "http://localhost:5002/api/ingredient";

const getIngredientById = async (ingredientId, token = "") => {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await axios.get(`${INGREDIENT_SERVICE_URL}/${ingredientId}`, { headers });
    return res.data;
};

module.exports = { getIngredientById };