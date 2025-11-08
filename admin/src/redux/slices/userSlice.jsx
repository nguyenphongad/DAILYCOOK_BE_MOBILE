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
