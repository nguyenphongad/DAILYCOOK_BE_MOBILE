import { createAsyncThunk } from '@reduxjs/toolkit';
import { get} from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import { setSelectedRecipe, setLoading, setError } from '../slices/recipeSlice';

export const fetchRecipeById = createAsyncThunk(
    'recipe/fetchRecipe',
    async (id, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_RECIPE}/${id}`,
                token
            );

            if (response.status) {
                dispatch(setSelectedRecipe(response.data));
                dispatch(setLoading(false));
                // Chỉ trả về dữ liệu cần thiết
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
