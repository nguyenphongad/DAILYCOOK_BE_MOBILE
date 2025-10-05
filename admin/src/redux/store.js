import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import dietTypeReducer from './slices/dietTypeSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    dietType: dietTypeReducer,
  },
})

export default store
