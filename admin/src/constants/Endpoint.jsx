const ENDPOINT = {
    // đăng nhập admin
    //auth
    LOGIN_ADMIN: 'auth/login-admin',
    CHECK_TOKEN: 'auth/check-token',

    // DIET TYPE
    ADD_DIET_TYPE: 'meals/add-diet-type',
    UPDATE_DIET_TYPE: 'meals/update-diet-type',
    DELETE_DIET_TYPE: 'meals/delete-diet-type',
    GET_LIST_DIET_TYPE: 'meals/diet-types',
    GET_DIET_TYPE: 'meals/diet-type',

    // MEAL CATEGORY
    ADD_MEAL_CATEGORY: 'meals/add-meal-category',
    UPDATE_MEAL_CATEGORY: 'meals/update-meal-category',
    DELETE_MEAL_CATEGORY: 'meals/delete-meal-category',
    GET_LIST_MEAL_CATEGORY: 'meals/meal-categories',
    GET_MEAL_CATEGORY: 'meals/meal-category',

    // MEAL
    ADD_MEAL: 'meals/add-meal',
    UPDATE_MEAL: 'meals/update-meal',
    DELETE_MEAL: 'meals/delete-meal',
    GET_LIST_MEAL: 'meals',
    GET_MEAL: 'meals/meal',

    // INGREDIENT CATEGORY
    ADD_INGREDIENT_CATEGORY: 'ingredients/add-ingredient-category',
    UPDATE_INGREDIENT_CATEGORY: 'ingredients/update-ingredient-category',
    DELETE_INGREDIENT_CATEGORY: 'ingredients/delete-ingredient-category',
    GET_LIST_INGREDIENT_CATEGORY: 'ingredients/ingredient-categories',
    GET_INGREDIENT_CATEGORY: 'ingredients/ingredient-category',

    // INGREDIENT
    ADD_INGREDIENT: 'ingredients/add-ingredient',
    UPDATE_INGREDIENT: 'ingredients/update-ingredient',
    DELETE_INGREDIENT: 'ingredients/delete-ingredient',
    GET_LIST_INGREDIENT: 'ingredients',
    GET_INGREDIENT: 'ingredients/ingredient',

    // MEASUREMENT UNITS
    GET_LIST_MEASUREMENT_UNITS: 'ingredients/measurement-units',

    // RECIPE
    GET_RECIPE: 'recipes/',

    // SURVEY
    GET_ALL_SURVEYS: 'surveys/admin/surveys',
    CREATE_SURVEY: 'surveys/admin/surveys',
    UPDATE_SURVEY: 'surveys/admin/surveys', // + /:id
    DELETE_SURVEY: 'surveys/admin/surveys', // + /:id

    // USER MANAGEMENT
    GET_USERS: 'users',
    UPDATE_USER_STATUS: 'users', // + /:accountId/status
}

export default ENDPOINT;