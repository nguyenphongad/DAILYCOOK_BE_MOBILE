import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import {
    setError,
    setLoading,
    setIngredients,
    addIngredientToList,
    removeIngredientFromList,
    updateIngredientInList,
    setIngredients
} from '../slices/ingredientSlice';

// Lấy danh sách tất cả ingredient 
export const fetchIngredientCategories = createAsyncThunk(
    'ingredients/fetchIngredientCategories',
    async (params = { page: 1, limit: 10 }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_LIST_INGREDIENT}?page=${params.page}&limit=${params.limit}`,
                token
            );

            if (response.status) {
                dispatch(setIngredients(response.data));
                return response;
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

// Lấy ingredient  bằng id
export const fetchIngredientById = createAsyncThunk(
    'ingredients/fetchIngredient',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_INGREDIENT}/${id}}`,
                token
            );

            if (response.status) {
                dispatch(setIngredients(response.data));
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

// Thêm ingredient  mới với hỗ trợ upload ảnh
export const addIngredient = createAsyncThunk(
    'ingredients/addIngredient',
    async (ingredientData, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await post(
                ENDPOINT.ADD_INGREDIENT,
                ingredientData,
                token);

            if (response.status) {
                dispatch(addIngredientToList(response.data));
                toast.success(response.message || 'Thêm danh mục nguyên liệu thành công');
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

// Cập nhật ingredient 
export const updateIngredient = createAsyncThunk(
    'ingredients/updateIngredient',
    async ({ id, ingredientData }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await put(
                `${ENDPOINT.UPDATE_INGREDIENT}/${id}`,
                ingredientData,
                token
            );

            if (response.status) {
                dispatch(updateIngredientInList(response.data));
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

// Xóa ingredient 
export const deleteIngredient = createAsyncThunk(
    'ingredients/deleteIngredient',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await del(`${ENDPOINT.DELETE_INGREDIENT}/${id}`,
                token
            );

            if (response.status) {
                dispatch(removeIngredientFromList(id));
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