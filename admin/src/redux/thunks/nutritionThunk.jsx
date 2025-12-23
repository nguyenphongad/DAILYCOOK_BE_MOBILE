import { createAsyncThunk } from '@reduxjs/toolkit';
import { get } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import {
    setError,
    setLoading,
    setSearchResults
} from '../slices/nutritionSlice';

// Tìm kiếm thông tin dinh dưỡng từ viendinhduong.vn qua proxy
export const searchNutritionData = createAsyncThunk(
    'nutrition/searchNutritionData',
    async ({ keyword, page = 1, pageSize = 15 }, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));

            const { token } = getState().auth;
            const response = await get(
                `${ENDPOINT.GET_NUTRITION_DATA}?page=${page}&pageSize=${pageSize}&name=${encodeURIComponent(keyword)}`,
                token
            );

            console.log('API Response:', response); // Debug log

            // Xử lý response từ API viendinhduong.vn
            // Response có cấu trúc: { data: { data: [...], current_page: 1, per_page: 15, total: 20 } }
            let dataArray = [];
            
            if (response && response.data) {
                // Trường hợp response từ backend proxy: { data: { data: [...] } }
                if (response.data.data && Array.isArray(response.data.data)) {
                    dataArray = response.data.data;
                }
                // Trường hợp response.data là array trực tiếp
                else if (Array.isArray(response.data)) {
                    dataArray = response.data;
                }
            } else if (Array.isArray(response)) {
                // Trường hợp response là array trực tiếp (ít xảy ra)
                dataArray = response;
            }

            console.log('Parsed data array:', dataArray); // Debug log
            console.log('Total items:', dataArray.length); // Debug log
            
            dispatch(setSearchResults(dataArray));
            
            if (dataArray.length > 0) {
                return dataArray;
            } else {
                const errorMsg = 'Không tìm thấy kết quả phù hợp';
                toast.info(errorMsg);
                return rejectWithValue(errorMsg);
            }
        } catch (error) {
            console.error('Search nutrition error:', error); // Debug log
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi khi tìm kiếm dữ liệu dinh dưỡng';
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);
