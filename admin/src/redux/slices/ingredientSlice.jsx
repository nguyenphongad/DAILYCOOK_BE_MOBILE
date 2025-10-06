import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    ingredients: [],
    selectedIngredient: null,
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

const ingredientSlice = createSlice({
    name: 'ingredients',
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

        setIngredients: (state, action) => {
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

        setSelectedIngredient: (state, action) => {
            state.selectedIngredient = action.payload;
        },

        addIngredientToList: (state, action) => {
            state.ingredientCategories = [action.payload, ...state.ingredientCategories];
            state.pagination.total += 1;
            state.loading = false;
            state.success = true;
        },

        updateIngredientInList: (state, action) => {
            const index = state.ingredientCategories.findIndex(item => item._id === action.payload._id);
            if (index !== -1) {
                state.ingredientCategories[index] = action.payload;
            }
            if (state.selectedIngredient && state.selectedIngredient._id === action.payload._id) {
                state.selectedIngredient = action.payload;
            }
            state.loading = false;
            state.success = true;
        },

        removeIngredientFromList: (state, action) => {
            state.ingredientCategories = state.ingredientCategories.filter(item => item._id !== action.payload);
            if (state.selectedIngredient && state.selectedIngredient._id === action.payload) {
                state.selectedIngredient = null;
            }
            state.pagination.total -= 1;
            state.loading = false;
            state.success = true;
        },

        resetIngredientState: () => initialState
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    setIngredients,
    setSelectedIngredient,
    addIngredientToList,
    updateIngredientInList,
    removeIngredientFromList,
    resetIngredientState
} = ingredientSlice.actions;

export default ingredientSlice.reducer;