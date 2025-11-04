import { createSlice } from '@reduxjs/toolkit'
import { fetchUsers, toggleUserStatus } from '../thunks/userThunk'

const initialState = {
  users: [],
  totalPages: 1,
  totalUsers: 0,
  loading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUserError: (state) => {
      state.error = null
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
      // toggleUserStatus
      .addCase(toggleUserStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.loading = false
        // Cập nhật trạng thái user trong danh sách
        const idx = state.users.findIndex(u => u._id === action.payload.data.userId)
        if (idx !== -1 && state.users[idx].accountInfo) {
          state.users[idx].accountInfo.isActive = action.payload.data.isActive
        }
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Lỗi khoá/mở khoá người dùng'
      })
  }
})

export const { clearUserError } = userSlice.actions
export default userSlice.reducer
