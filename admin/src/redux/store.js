import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dietTypeReducer from './slices/dietTypeSlice'
import ingredientCategoryReducer from './slices/ingredientCategorySlice'
import ingredientReducer from './slices/ingredientSlice'
import mealCategoryReducer from './slices/mealCategorySlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    dietType: dietTypeReducer,
    ingredientCategory: ingredientCategoryReducer,
    ingredients: ingredientReducer,
    mealCategory: mealCategoryReducer
  },
})

export default store
