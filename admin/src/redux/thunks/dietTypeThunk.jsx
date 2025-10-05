import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import { 
  setLoading, 
  setError, 
  setDietTypes, 
  setSelectedDietType,
  addDietTypeToList,
  updateDietTypeInList,
  removeDietTypeFromList
} from '../slices/dietTypeSlice';

// Lấy danh sách tất cả diet types
export const fetchDietTypes = createAsyncThunk(
  'dietType/fetchDietTypes',
  async (params = { page: 1, limit: 10 }, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const { token } = getState().auth;
      const response = await get(
        `${ENDPOINT.GET_LIST_DIET_TYPE}?page=${params.page}&limit=${params.limit}`,
        token
      );
      
      if (response.status) {
        dispatch(setDietTypes(response.data));
        return response;
      } else {
        dispatch(setError(response.message));
        toast.error(response.message || 'Không thể tải danh sách');
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Lỗi kết nối đến server';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Lấy thông tin chi tiết của một diet type
export const fetchDietTypeById = createAsyncThunk(
  'dietType/fetchDietTypeById',
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const { token } = getState().auth;
      const response = await get(`${ENDPOINT.GET_DIET_TYPE}/${id}`, token);
      
      if (response.status) {
        dispatch(setSelectedDietType(response.data));
        dispatch(setLoading(false));
        return response.data;
      } else {
        dispatch(setError(response.message));
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      dispatch(setError(error.message));
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Thêm diet type mới với hỗ trợ upload ảnh
export const addDietType = createAsyncThunk(
  'dietType/addDietType',
  async (dietTypeData, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const { token } = getState().auth;
      
      // dietTypeData đã chứa dietTypeImage URL từ Cloudinary
      const response = await post(ENDPOINT.ADD_DIET_TYPE, dietTypeData, token);
      
      if (response.status) {
        dispatch(addDietTypeToList(response.data));
        toast.success(response.message || 'Thêm chế độ ăn thành công');
        return response.data;
      } else {
        dispatch(setError(response.message));
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Lỗi kết nối đến server';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Cập nhật diet type với hỗ trợ upload ảnh
export const updateDietType = createAsyncThunk(
  'dietType/updateDietType',
  async ({ id, dietTypeData }, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const { token } = getState().auth;
      
      // dietTypeData đã chứa dietTypeImage URL từ Cloudinary
      const response = await put(`${ENDPOINT.UPDATE_DIET_TYPE}/${id}`, dietTypeData, token);
      
      if (response.status) {
        dispatch(updateDietTypeInList(response.data));
        toast.success(response.message || 'Cập nhật thành công');
        return response.data;
      } else {
        dispatch(setError(response.message));
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      const errorMessage = error.message || 'Lỗi kết nối đến server';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

// Xóa diet type
export const deleteDietType = createAsyncThunk(
  'dietType/deleteDietType',
  async (id, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      
      const { token } = getState().auth;
      const response = await del(`${ENDPOINT.DELETE_DIET_TYPE}/${id}`, token);
      
      if (response.status) {
        dispatch(removeDietTypeFromList(id));
        toast.success(response.message || 'Xóa thành công');
        return id;
      } else {
        dispatch(setError(response.message));
        toast.error(response.message);
        return rejectWithValue(response.message);
      }
    } catch (error) {
      dispatch(setError(error.message));
      toast.error(error.message);
      return rejectWithValue(error.message);
    }
  }
);