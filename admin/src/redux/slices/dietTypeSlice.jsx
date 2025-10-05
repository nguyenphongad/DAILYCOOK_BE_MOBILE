import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dietTypes: [],
  selectedDietType: null,
  loading: false,
  error: null,
  success: false,
  pagination: {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  }
};

const dietTypeSlice = createSlice({
  name: 'dietType',
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
    
    // Các reducers liên quan đến dữ liệu
    setDietTypes: (state, action) => {
      // Cấu trúc API trả về là {stype, message, status, data: { dietTypes, total, page, limit, totalPages }}
      if (action.payload && action.payload.data) {
        const { total, page, limit, totalPages, dietTypes } = action.payload.data;
        
        state.dietTypes = dietTypes || [];
        state.pagination = {
          total: total || 0,
          page: page || 1,
          limit: limit || 10,
          totalPages: totalPages || 1
        };
      } else {
        state.dietTypes = [];
      }
      state.loading = false;
    },
    setSelectedDietType: (state, action) => {
      state.selectedDietType = action.payload;
    },
    
    // Thêm diet type mới vào danh sách
    addDietTypeToList: (state, action) => {
      state.dietTypes = [action.payload, ...state.dietTypes];
      state.pagination.total += 1;
      state.loading = false;
      state.success = true;
    },
    
    // Cập nhật diet type trong danh sách
    updateDietTypeInList: (state, action) => {
      const index = state.dietTypes.findIndex(item => item._id === action.payload._id);
      if (index !== -1) {
        state.dietTypes[index] = action.payload;
      }
      if (state.selectedDietType && state.selectedDietType._id === action.payload._id) {
        state.selectedDietType = action.payload;
      }
      state.loading = false;
      state.success = true;
    },
    
    // Xoá diet type khỏi danh sách
    removeDietTypeFromList: (state, action) => {
      state.dietTypes = state.dietTypes.filter(item => item._id !== action.payload);
      if (state.selectedDietType && state.selectedDietType._id === action.payload) {
        state.selectedDietType = null;
      }
      state.pagination.total -= 1;
      state.loading = false;
      state.success = true;
    },
    
    // Reset state
    resetDietTypeState: () => initialState
  }
});

export const {
  setLoading,
  setError,
  clearError,
  setSuccess,
  setDietTypes,
  setSelectedDietType,
  addDietTypeToList,
  updateDietTypeInList,
  removeDietTypeFromList,
  resetDietTypeState
} = dietTypeSlice.actions;

export default dietTypeSlice.reducer;