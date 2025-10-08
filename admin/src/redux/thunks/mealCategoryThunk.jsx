import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import { 
    setError, 
    setLoading, 
    setMealCategories, 
    setSelectedMealCategory, 
    addMealCategoryToList, 
    updateMealCategoryInList, 
    removeMealCategoryFromList,
} from '../slices/mealCategorySlice';

// Lấy danh sách tất cả meal category
export const fetchMealCategories = createAsyncThunk(
    'mealCategory/fetchMealCategories',
    async (params = { page: 1, limit: 10 }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_LIST_MEAL_CATEGORY}?page=${params.page}&limit=${params.limit}`,
                token
            );

            if (response.status) {
                dispatch(setMealCategories(response.data));
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

// Lấy meal category bằng id
export const fetchMealCategoryById = createAsyncThunk(
    'mealCategory/fetchMealCategory',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_MEAL_CATEGORY}/${id}}`,
                token
            );

            if (response.status) {
                dispatch(setSelectedMealCategory(response.data));
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

// Thêm meal category mới với hỗ trợ upload ảnh
export const addMealCategory = createAsyncThunk(
    'mealCategory/addMealCategory',
    async (mealCategoryData, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await post(
                ENDPOINT.ADD_MEAL_CATEGORY,
                mealCategoryData,
                token);

            if (response.status) {
                dispatch(addMealCategoryToList(response.data));
                toast.success(response.message || 'Thêm danh mục món ăn thành công');
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

// Cập meal ingredient category
export const updateMealCategory = createAsyncThunk(
    'mealCategory/updateMealCategory',
    async ({ id, mealCategoryData }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await put(
                `${ENDPOINT.UPDATE_MEAL_CATEGORY}/${id}`,
                mealCategoryData,
                token
            );

            if (response.status) {
                dispatch(updateMealCategoryInList(response.data));
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

// Xóa meal category
export const deleteMealCategory = createAsyncThunk(
    'mealCategory/deleteMealCategory',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await del(`${ENDPOINT.DELETE_MEAL_CATEGORY}/${id}`,
                token
            );

            if (response.status) {
                dispatch(removeMealCategoryFromList(id));
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