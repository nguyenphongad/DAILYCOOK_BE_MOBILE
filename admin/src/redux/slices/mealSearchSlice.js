import { createSlice } from '@reduxjs/toolkit';
import { searchMealData } from '../thunks/mealSearchThunk';

const initialState = {
    searchResults: [],
    loading: false,
    error: null
};

const mealSearchSlice = createSlice({
    name: 'mealSearch',
    initialState,
    reducers: {
        clearMealSearchResults: (state) => {
            state.searchResults = [];
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(searchMealData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(searchMealData.fulfilled, (state, action) => {
                state.loading = false;
                state.searchResults = action.payload || [];
            })
            .addCase(searchMealData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Có lỗi xảy ra khi tìm kiếm món ăn';
            });
    }
});

export const { clearMealSearchResults } = mealSearchSlice.actions;
export default mealSearchSlice.reducer;
