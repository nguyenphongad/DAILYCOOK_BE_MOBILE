import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import {
    setError,
    setLoading,
    setMeals,
    setSelectedMeal,
    addMealToList,
    updateMealInList,
    removeMealFromList,
} from '../slices/mealSlice';

// Lấy danh sách tất cả meal 
export const fetchMeals = createAsyncThunk(
    'meals/fetchMealCategories',
    async (params = { page: 1, limit: 10 }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_LIST_MEAL}?page=${params.page}&limit=${params.limit}`,
                token
            );

            if (response.status) {
                dispatch(setMeals(response.data));
                // Chỉ trả về dữ liệu cần thiết
                return {
                    data: response.data,
                    pagination: {
                        page: params.page,
                        limit: params.limit,
                        total: response.total || 0
                    }
                };
            } else {
                dispatch(setError(response.message));
                toast.error(response.message || 'Không thể tải danh sách');
                return rejectWithValue(response.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối đến server';
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Lấy meal bằng id
export const fetchMealById = createAsyncThunk(
    'meals/fetchMeal',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_MEAL}/${id}}`,
                token
            );

            if (response.status) {
                dispatch(setSelectedMeal(response.data));
                dispatch(setLoading(false));
                return response.data;
            } else {
                dispatch(setError(response.message));
                toast.error(response.message || 'Không thể tải danh sách');
                return rejectWithValue(response.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối đến server';
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
)

// Thêm meal mới với hỗ trợ upload ảnh
export const addMeal = createAsyncThunk(
  'meals/addMeal',
  async (mealData, { dispatch, getState, rejectWithValue }) => {
    try {
      dispatch(setLoading(true));
      const { token } = getState().auth;
      
      // Kiểm tra dữ liệu trước khi gửi
      if (!mealData || typeof mealData !== 'object') {
        throw new Error('Dữ liệu không hợp lệ');
      }
      
      if (!mealData.nameMeal) {
        throw new Error('Thiếu tên món ăn (nameMeal)');
      }

      // Đảm bảo mealImage và recipeImage là string (dù rỗng)
      if (mealData.mealImage === undefined || mealData.mealImage === null) {
        mealData.mealImage = "";
      }
      
      if (mealData.recipe && (mealData.recipe.recipeImage === undefined || mealData.recipe.recipeImage === null)) {
        mealData.recipe.recipeImage = "";
      }

      // Gọi API
      const response = await post(
        ENDPOINT.ADD_MEAL,
        mealData,
        token
      );

      if (response && response.status) {
        dispatch(addMealToList(response.data));
        toast.success(response.message || 'Thêm món ăn thành công');
        return response.data;
      } else {
        const errorMessage = response?.message || 'Không thể thêm món ăn';
        dispatch(setError(errorMessage));
        toast.error(errorMessage);
        return rejectWithValue(errorMessage);
      }
    } catch (error) {      
      const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối đến server';
      dispatch(setError(errorMessage));
      toast.error(errorMessage);
      return rejectWithValue(errorMessage);
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Cập meal ingredient 
export const updateMeal = createAsyncThunk(
    'meals/updateMeal',
    async ({ id, mealData }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await put(
                `${ENDPOINT.UPDATE_MEAL}/${id}`,
                mealData,
                token
            );

            if (response.status) {
                dispatch(updateMealInList(response.data));
                toast.success(response.message || 'Cập nhật thành công');
                return response.data;
            } else {
                dispatch(setError(response.message));
                toast.error(response.message);
                return rejectWithValue(response.message);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối đến server';
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);

// Xóa meal 
export const deleteMeal = createAsyncThunk(
    'meals/deleteMeal',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await del(`${ENDPOINT.DELETE_MEAL}/${id}`,
                token
            );

            if (response.status) {
                dispatch(removeMealFromList(id));
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