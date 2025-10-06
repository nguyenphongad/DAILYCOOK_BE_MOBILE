import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dietTypeReducer from './slices/dietTypeSlice'
import ingredientCategoryReducer from './slices/ingredientCategorySlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    dietType: dietTypeReducer,
    ingredientCategory: ingredientCategoryReducer
  },
})

export default store
