require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL
    },
    user: {
      url: process.env.USER_SERVICE_URL
    },
    recipe: {
      url: process.env.RECIPE_SERVICE_URL
    },
    ingredient: {
      url: process.env.INGREDIENT_SERVICE_URL
    },
    meal: {
      url: process.env.MEAL_SERVICE_URL
    },
    mealplan: {
      url: process.env.MEALPLAN_SERVICE_URL
    },
    shopping: {
      url: process.env.SHOPPING_SERVICE_URL
    }
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
