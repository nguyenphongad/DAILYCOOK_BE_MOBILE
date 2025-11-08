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
