import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    mealCategories: [],
    selectedMealCategory: null,
    loading: false,
    error: null,
    success: false,
    pagination: {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1
    }
}

const mealCategorySlice = createSlice({
    name: 'mealCategory',
    initialState,
    reducers: {
        // Các reducers chung
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
        setSuccess: (state, action) => {
            state.success = action.payload;
        },

        setMealCategories: (state, action) => {
            if (action.payload && action.payload.data) {
                const { total, page, limit, totalPages, mealCategories } = action.payload.data;

                state.mealCategories = mealCategories || [];
                state.pagination = {
                    total: total || 0,
                    page: page || 1,
                    limit: limit || 10,
                    totalPages: totalPages || 1
                }
            } else {
                state.mealCategories = [];
            }
            state.loading = false;
        },

        setSelectedMealCategory: (state, action) => {
            state.selectedMealCategory = action.payload;
        },

        addMealCategoryToList: (state, action) => {
            state.mealCategories = [action.payload, ...state.mealCategories];
            state.pagination.total += 1;
            state.loading = false;
            state.success = true;
        },

        updateMealCategoryInList: (state, action) => {
            const index = state.mealCategories.findIndex(item => item._id === action.payload._id);
            if (index !== -1) {
                state.mealCategories[index] = action.payload;
            }
            if (state.selectedMealCategory && state.selectedMealCategory._id === action.payload._id) {
                state.selectedMealCategory = action.payload;
            }
            state.loading = false;
            state.success = true;
        },

        removeMealCategoryFromList: (state, action) => {
            state.mealCategories = state.mealCategories.filter(item => item._id !== action.payload);
            if (state.selectedMealCategory && state.selectedMealCategory._id === action.payload) {
                state.selectedMealCategory = null;
            }
            state.pagination.total -= 1;
            state.loading = false;
            state.success = true;
        },

        resetMealCategoryState: () => initialState
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    setMealCategories,
    setSelectedMealCategory,
    addMealCategoryToList,
    updateMealCategoryInList,
    removeMealCategoryFromList,
    resetMealCategoryState
} = mealCategorySlice.actions;

export default mealCategorySlice.reducer;