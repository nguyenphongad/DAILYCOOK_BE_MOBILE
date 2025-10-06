import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import { setError, setLoading } from '../slices/ingredientCategorySlice';
import { addIngredientCategoryToList, removeIngredientCategoryFromList, setIngredientCategories, updateIngredientCategoryInList } from '../slices/ingredientCategorySlice';

// Lấy danh sách tất cả ingredient category
export const fetchIngredientCategories = createAsyncThunk(
    'ingredientCategory/fetchIngredientCategories',
    async (params = { page: 1, limit: 10 }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_LIST_INGREDIENT_CATEGORY}?page=${params.page}&limit=${params.limit}`,
                token
            );

            if (response.status) {
                dispatch(setIngredientCategories(response.data));
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

// Lấy ingredient category bằng id
export const fetchIngredientCategoryById = createAsyncThunk(
    'ingredientCategory/fetchIngredientCategory',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_INGREDIENT_CATEGORY}/${id}}`,
                token
            );

            if (response.status) {
                dispatch(setIngredientCategories(response.data));
                dispatch(setLoading(false));
                return response.data;
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
)

// Thêm ingredient category mới với hỗ trợ upload ảnh
export const addIngredientCategory = createAsyncThunk(
    'ingredientCategory/addIngredientCategory',
    async (ingredientCategoryData, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await post(
                ENDPOINT.ADD_INGREDIENT_CATEGORY,
                ingredientCategoryData,
                token);

            if (response.status) {
                dispatch(addIngredientCategoryToList(response.data));
                toast.success(response.message || 'Thêm danh mục nguyên liệu thành công');
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

// Cập nhật ingredient category
export const updateIngredientCategory = createAsyncThunk(
    'ingredientCategory/updateIngredientCategory',
    async ({ id, ingredientCategoryData }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await put(
                `${ENDPOINT.UPDATE_INGREDIENT_CATEGORY}/${id}`,
                ingredientCategoryData,
                token
            );

            if (response.status) {
                dispatch(updateIngredientCategoryInList(response.data));
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

// Xóa ingredient category
export const deleteIngredientCategory = createAsyncThunk(
    'ingredientCategory/deleteIngredientCategory',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await del(`${ENDPOINT.DELETE_INGREDIENT_CATEGORY}/${id}`,
                token
            );

            if (response.status) {
                dispatch(removeIngredientCategoryFromList(id));
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