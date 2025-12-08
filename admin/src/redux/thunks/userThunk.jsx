import { createAsyncThunk } from '@reduxjs/toolkit'
import { get, patch } from '../../services/api.service'
import ENDPOINT from '../../constants/Endpoint'

// Lấy danh sách user (có phân trang và search)
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async ({ token, page = 1, limit = 10, search = '' }, { rejectWithValue }) => {
    try {
      const params = { page, limit, search }
      const res = await get(`/${ENDPOINT.GET_USERS}`, token, params)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Lấy tổng số người dùng và thống kê
export const fetchTotalUsers = createAsyncThunk(
  'users/fetchTotalUsers',
  async ({ token }, { rejectWithValue }) => {
    try {
      // Sử dụng ENDPOINT constant
      const res = await get(`/${ENDPOINT.GET_TOTAL_USERS}`, token)
      // Chỉ trả về data thay vì toàn bộ response
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Lấy tổng số chế độ ăn và thống kê
export const fetchTotalDietTypes = createAsyncThunk(
  'users/fetchTotalDietTypes',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await get(`/${ENDPOINT.GET_TOTAL_DIET_TYPES}`, token)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Lấy tổng số món ăn và thống kê
export const fetchTotalMeals = createAsyncThunk(
  'users/fetchTotalMeals',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await get(`/${ENDPOINT.GET_TOTAL_MEALS}`, token)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Lấy tổng số nguyên liệu và thống kê
export const fetchTotalIngredients = createAsyncThunk(
  'users/fetchTotalIngredients',
  async ({ token }, { rejectWithValue }) => {
    try {
      const res = await get(`/${ENDPOINT.GET_TOTAL_INGREDIENTS}`, token)
      return res.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message)
    }
  }
)

// Khoá/mở khoá user
export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, isActive, token }, { rejectWithValue }) => {
    try {
      const res = await patch(`/${ENDPOINT.UPDATE_USER_STATUS}/${userId}/status`, { isActive }, token)
      
      if (res.success) {
        return {
          success: true,
          data: {
            userId: userId,
            isActive: isActive
          },
          message: res.message
        }
      } else {
        throw new Error(res.message || 'Cập nhật trạng thái thất bại')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối'
      return rejectWithValue(errorMessage)
    }
  }
)
