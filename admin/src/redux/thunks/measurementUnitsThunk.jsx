// src/redux/thunks/measurementUnitsThunk.js
import { createAsyncThunk } from '@reduxjs/toolkit';
import { get } from '../../services/api.service';
import ENDPOINT from '../../constants/Endpoint';
import { toast } from 'sonner';
import { setLoading, setError, setMeasurementUnits } from '../slices/measurementUnitsSlice';

export const fetchMeasurementUnits = createAsyncThunk(
    'ingredients/fetchMeasurementUnits',
    async (_, { dispatch, getState, rejectWithValue }) => {
        try {
            dispatch(setLoading(true));
            const { token } = getState().auth;

            const response = await get(`${ENDPOINT.GET_LIST_MEASUREMENT_UNITS}`, token);
            
            if (response && response.status) {
                // response.data === [{ key, label }, ...]
                dispatch(setMeasurementUnits(response.data));
                return response.data;
            } else {
                const err = response?.message || 'Không thể tải danh sách đơn vị đo';
                dispatch(setError(err));
                toast.error(err);
                return rejectWithValue(err);
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Lỗi kết nối đến server';
            dispatch(setError(errorMessage));
            toast.error(errorMessage);
            return rejectWithValue(errorMessage);
        }
    }
);
