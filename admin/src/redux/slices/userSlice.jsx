import { createSlice } from '@reduxjs/toolkit'
import { fetchUsers, toggleUserStatus, fetchTotalUsers, fetchTotalDietTypes, fetchTotalMeals, fetchTotalIngredients } from '../thunks/userThunk'

const initialState = {
  users: [],
  totalPages: 1,
  totalUsers: 0,
  loading: false,
  error: null,
  // Thêm state cho thống kê
  userStats: {
    totalUsers: 0,
    exactCount: 0,
    monthlyStats: [],
    recentUsers: []
  },
  statsLoading: false,
  statsError: null,
  // Thêm state cho thống kê chế độ ăn
  dietTypeStats: {
    totalDietTypes: 0,
    exactCount: 0,
    recentDietTypes: []
  },
  dietStatsLoading: false,
  dietStatsError: null,
  // Thêm state cho thống kê món ăn
  mealStats: {
    totalMeals: 0,
    exactCount: 0,
    recentMeals: []
  },
  mealStatsLoading: false,
  mealStatsError: null,
  // Thêm state cho thống kê nguyên liệu
  ingredientStats: {
    totalIngredients: 0,
    exactCount: 0,
    recentIngredients: []
  },
  ingredientStatsLoading: false,
  ingredientStatsError: null
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null
      state.statsError = null
      state.dietStatsError = null
      state.mealStatsError = null
      state.ingredientStatsError = null
    }
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.data
        state.totalPages = action.payload.totalPages
        state.totalUsers = action.payload.totalUsers
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Lỗi lấy danh sách người dùng'
      })
      // fetchTotalUsers
      .addCase(fetchTotalUsers.pending, (state) => {
        state.statsLoading = true
        state.statsError = null
      })
      .addCase(fetchTotalUsers.fulfilled, (state, action) => {
        state.statsLoading = false
        // Xử lý đúng cấu trúc dữ liệu từ API
        if (action.payload && action.payload.data) {
          state.userStats = action.payload.data
        } else {
          // Fallback nếu cấu trúc khác
          state.userStats = action.payload
        }
      })
      .addCase(fetchTotalUsers.rejected, (state, action) => {
        state.statsLoading = false
        state.statsError = action.payload || 'Lỗi lấy thống kê người dùng'
      })
      // fetchTotalDietTypes
      .addCase(fetchTotalDietTypes.pending, (state) => {
        state.dietStatsLoading = true
        state.dietStatsError = null
      })
      .addCase(fetchTotalDietTypes.fulfilled, (state, action) => {
        state.dietStatsLoading = false
        if (action.payload && action.payload.data) {
          state.dietTypeStats = action.payload.data
        } else {
          state.dietTypeStats = action.payload
        }
      })
      .addCase(fetchTotalDietTypes.rejected, (state, action) => {
        state.dietStatsLoading = false
        state.dietStatsError = action.payload || 'Lỗi lấy thống kê chế độ ăn'
      })
      // fetchTotalMeals
      .addCase(fetchTotalMeals.pending, (state) => {
        state.mealStatsLoading = true
        state.mealStatsError = null
      })
      .addCase(fetchTotalMeals.fulfilled, (state, action) => {
        state.mealStatsLoading = false
        if (action.payload && action.payload.data) {
          state.mealStats = action.payload.data
        } else {
          state.mealStats = action.payload
        }
      })
      .addCase(fetchTotalMeals.rejected, (state, action) => {
        state.mealStatsLoading = false
        state.mealStatsError = action.payload || 'Lỗi lấy thống kê món ăn'
      })
      // fetchTotalIngredients
      .addCase(fetchTotalIngredients.pending, (state) => {
        state.ingredientStatsLoading = true
        state.ingredientStatsError = null
      })
      .addCase(fetchTotalIngredients.fulfilled, (state, action) => {
        state.ingredientStatsLoading = false
        if (action.payload && action.payload.data) {
          state.ingredientStats = action.payload.data
        } else {
          state.ingredientStats = action.payload
        }
      })
      .addCase(fetchTotalIngredients.rejected, (state, action) => {
        state.ingredientStatsLoading = false
        state.ingredientStatsError = action.payload || 'Lỗi lấy thống kê nguyên liệu'
      })
      // toggleUserStatus - FIX: Không set loading cho action này
      .addCase(toggleUserStatus.pending, (state) => {
        // Không set loading = true ở đây để tránh loading toàn trang
        state.error = null
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        // Đảm bảo loading = false
        state.loading = false
        // Cập nhật trạng thái user trong danh sách
        const userId = action.meta.arg.userId
        const newStatus = action.meta.arg.isActive
        const idx = state.users.findIndex(u => u._id === userId)
        if (idx !== -1 && state.users[idx].accountInfo) {
          state.users[idx].accountInfo.isActive = newStatus
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        // Đảm bảo loading = false
        state.loading = false
        state.error = action.payload || 'Lỗi khoá/mở khoá người dùng'
      })
  }
})

export const { clearUserError } = userSlice.actions
export default userSlice.reducer
