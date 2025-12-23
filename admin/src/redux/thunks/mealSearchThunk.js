import { createAsyncThunk } from '@reduxjs/toolkit';
import { get } from '../../services/api.service';
import ENDPOINT from '../../constants/Endpoint';
import { message } from 'antd';

/**
 * Tìm kiếm thông tin món ăn từ viendinhduong.vn
 * @param {Object} params - { keyword, page, pageSize, energy }
 */
export const searchMealData = createAsyncThunk(
    'mealSearch/searchMealData',
    async ({ keyword, page = 1, pageSize = 15, energy = 0 }, { rejectWithValue, getState }) => {
        try {
            const token = getState().auth?.token;
            
            const response = await get(
                ENDPOINT.GET_PAGE_FOOD_DATA,
                token,
                {
                    name: keyword.trim(),
                    page,
                    pageSize,
                    energy
                }
            );

            if (response.data && response.data.status) {
                return response.data.data || [];
            } else {
                message.error(response.data?.message || 'Không tìm thấy món ăn');
                return rejectWithValue(response.data?.message || 'Không tìm thấy món ăn');
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Lỗi khi tìm kiếm món ăn từ viendinhduong.vn';
            message.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);
