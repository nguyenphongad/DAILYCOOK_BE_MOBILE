import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    searchResults: [], // Đảm bảo luôn là array
    loading: false,
    error: null
}

const nutritionSlice = createSlice({
    name: 'nutrition',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.loading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
            state.loading = false;
        },
        clearError: (state) => {
            state.error = null;
        },
        setSearchResults: (state, action) => {
            // Đảm bảo luôn là array
            state.searchResults = Array.isArray(action.payload) ? action.payload : [];
            state.loading = false;
        },
        clearSearchResults: (state) => {
            state.searchResults = [];
        }
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSearchResults,
    clearSearchResults
} = nutritionSlice.actions;

export default nutritionSlice.reducer;
