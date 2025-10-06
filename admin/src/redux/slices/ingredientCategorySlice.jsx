import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    ingredientCategories: [],
    selectedIngredientCategory: null,
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

const ingredientCategorySlice = createSlice({
    name: 'ingredientCategory',
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

        setIngredientCategories: (state, action) => {
            if (action.payload && action.payload.data) {
                const { total, page, limit, totalPages, ingredientCategories } = action.payload.data;

                state.ingredientCategories = ingredientCategories || [];
                state.pagination = {
                    total: total || 0,
                    page: page || 1,
                    limit: limit || 10,
                    totalPages: totalPages || 1
                }
            } else {
                state.ingredientCategories = [];
            }
            state.loading = false;
        },

        setSelectedIngredientCategory: (state, action) => {
            state.selectedIngredientCategory = action.payload;
        },

        addIngredientCategoryToList: (state, action) => {
            state.ingredientCategories = [action.payload, ...state.ingredientCategories];
            state.pagination.total += 1;
            state.loading = false;
            state.success = true;
        },

        updateIngredientCategoryInList: (state, action) => {
            const index = state.ingredientCategories.findIndex(item => item._id === action.payload._id);
            if (index !== -1) {
                state.ingredientCategories[index] = action.payload;
            }
            if (state.selectedIngredientCategory && state.selectedIngredientCategory._id === action.payload._id) {
                state.selectedIngredientCategory = action.payload;
            }
            state.loading = false;
            state.success = true;
        },

        removeIngredientCategoryFromList: (state, action) => {
            state.ingredientCategories = state.ingredientCategories.filter(item => item._id !== action.payload);
            if (state.selectedIngredientCategory && state.selectedIngredientCategory._id === action.payload) {
                state.selectedIngredientCategory = null;
            }
            state.pagination.total -= 1;
            state.loading = false;
            state.success = true;
        },

        resetIngredientCategoryState: () => initialState
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    setIngredientCategories,
    addIngredientCategoryToList,
    updateIngredientCategoryInList,
    removeIngredientCategoryFromList,
    resetIngredientCategoryState
} = ingredientCategorySlice.actions;

export default ingredientCategorySlice.reducer;