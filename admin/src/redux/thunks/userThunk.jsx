import { createAsyncThunk } from '@reduxjs/toolkit'
import { get, patch } from '../../services/api.service'

// Lấy danh sách user (có phân trang và search)
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ token, page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const params = { page, limit, search }
      const res = await get('/users', token, params)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)

// Khoá/mở khoá user
export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, isActive, token }, { rejectWithValue }) => {
    try {
      const res = await patch(`/users/${userId}/status`, { isActive }, token)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message)
    }
  }
)
