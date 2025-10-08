// src/redux/slices/measurementUnitsSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    measurementUnits: [],
    loading: false,
    error: null,
    success: false
};

const measurementUnitsSlice = createSlice({
    name: 'measurementUnits',
    initialState,
    reducers: {
        setLoading(state, action) {
            state.loading = action.payload;
        },
        setError(state, action) {
            state.error = action.payload;
            state.loading = false;
        },
        clearError(state) {
            state.error = null;
        },
        setSuccess(state, action) {
            state.success = action.payload;
        },
        setMeasurementUnits(state, action) {
            const payload = action.payload;
            if (Array.isArray(payload)) {
                state.measurementUnits = payload;
            } else if (payload && Array.isArray(payload.data)) {
                state.measurementUnits = payload.data;
            } else {
                state.measurementUnits = [];
            }
            state.loading = false;
        }
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    setMeasurementUnits
} = measurementUnitsSlice.actions;

export default measurementUnitsSlice.reducer;
