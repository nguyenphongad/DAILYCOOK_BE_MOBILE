import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dietTypeReducer from './slices/dietTypeSlice'
import ingredientReducer from './slices/ingredientSlice'
import ingredientCategoryReducer from './slices/ingredientCategorySlice'
import mealReducer from './slices/mealSlice'
import mealCategoryReducer from './slices/mealCategorySlice'
import measurementUnitsReducer from './slices/measurementUnitsSlice'
import recipeReducer from './slices/recipeSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    dietType: dietTypeReducer,
    ingredients: ingredientReducer,
    ingredientCategory: ingredientCategoryReducer,
    meals: mealReducer,
    mealCategory: mealCategoryReducer,
    measurementUnits: measurementUnitsReducer,
    recipes: recipeReducer
  },
})

export default store
