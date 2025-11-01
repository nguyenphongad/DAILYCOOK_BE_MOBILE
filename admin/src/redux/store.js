import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dietTypeReducer from './slices/dietTypeSlice'
import ingredientReducer from './slices/ingredientSlice'
import ingredientCategoryReducer from './slices/ingredientCategorySlice'
import mealReducer from './slices/mealSlice'
import mealCategoryReducer from './slices/mealCategorySlice'
import measurementUnitsReducer from './slices/measurementUnitsSlice'
import recipeReducer from './slices/recipeSlice'
import userReducer from './slices/userSlice'
import surveyReducer from './slices/surveySlice'


const store = configureStore({
  reducer: {
    auth: authReducer,
    dietType: dietTypeReducer,
    ingredients: ingredientReducer,
    ingredientCategory: ingredientCategoryReducer,
    meals: mealReducer,
    mealCategories: mealCategoryReducer, // Thêm reducer này
    measurementUnits: measurementUnitsReducer,
    recipes: recipeReducer,
    users: userReducer,
    survey: surveyReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Bỏ qua việc kiểm tra cho các action không tuần tự hóa được
        ignoredActions: [
          /.*\/fulfilled$/,  // Tạm thời bỏ qua tất cả các action fulfilled
          /.*\/rejected$/    // Bỏ qua tất cả các action rejected
        ],
      },
    }),
})

export default store
