import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    meals: [],
    selectedMeal: null,
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

const mealSlice = createSlice({
    name: 'meals',
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

        setMeals: (state, action) => {
            if (action.payload && action.payload.data) {
                const { total, page, limit, totalPages, meals } = action.payload.data;

                state.meals = meals || [];
                state.pagination = {
                    total: total || 0,
                    page: page || 1,
                    limit: limit || 10,
                    totalPages: totalPages || 1
                }
            } else {
                state.meals = [];
            }
            state.loading = false;
        },

        setSelectedMeal: (state, action) => {
            state.selectedMeal = action.payload;
        },

        addMealToList: (state, action) => {
            state.meals = [action.payload, ...state.meals];
            state.pagination.total += 1;
            state.loading = false;
            state.success = true;
        },

        updateMealInList: (state, action) => {
            const index = state.meals.findIndex(item => item._id === action.payload._id);
            if (index !== -1) {
                state.meals[index] = action.payload;
            }
            if (state.selectedMeal && state.selectedMeal._id === action.payload._id) {
                state.selectedMeal = action.payload;
            }
            state.loading = false;
            state.success = true;
        },

        removeMealFromList: (state, action) => {
            state.meals = state.meals.filter(item => item._id !== action.payload);
            if (state.selectedMeal && state.selectedMeal._id === action.payload) {
                state.selectedMeal = null;
            }
            state.pagination.total -= 1;
            state.loading = false;
            state.success = true;
        },

        resetMealState: () => initialState
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    setMeals,
    setSelectedMeal,
    addMealToList,
    updateMealInList,
    removeMealFromList,
    resetMealState
} = mealSlice.actions;

export default mealSlice.reducer;