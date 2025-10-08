import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    recipes: [],
    selectedRecipe: null,
    loading: false,
    error: null,
    success: false,
}

const recipeSlice = createSlice({
    name: 'recipes',
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
        clearRecipe: (state) => {
            state.selectedRecipe = null;
            state.loading = false;
            state.error = null;
        },

        setSelectedRecipe: (state, action) => {
            state.selectedRecipe = action.payload;
        },

        resetRecipeState: () => initialState
    }
});

export const {
    setLoading,
    setError,
    clearError,
    setSuccess,
    clearRecipe,
    setSelectedRecipe,
    resetRecipeState
} = recipeSlice.actions;

export default recipeSlice.reducer;