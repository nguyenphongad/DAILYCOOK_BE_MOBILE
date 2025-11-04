import { createSlice } from '@reduxjs/toolkit';
import { 
    getAllSurveysAdmin,
    createSurvey,
    updateSurvey,
    deleteSurvey 
} from '../thunks/surveyThunk';

const initialState = {
    surveys: [],
    loading: false,
    error: null,
    currentSurvey: null,
    message: null,
    status: null
};

const surveySlice = createSlice({
    name: 'survey',
    initialState,
    reducers: {
        setCurrentSurvey: (state, action) => {
            state.currentSurvey = action.payload;
        },
        clearCurrentSurvey: (state) => {
            state.currentSurvey = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Get All Surveys
            .addCase(getAllSurveysAdmin.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getAllSurveysAdmin.fulfilled, (state, action) => {
                state.loading = false;
                state.surveys = action.payload.data;
                state.message = action.payload.message;
                state.status = action.payload.status;
                state.error = null;
            })
            .addCase(getAllSurveysAdmin.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Lỗi không xác định";
                state.status = false;
            })

            // Create Survey
            .addCase(createSurvey.pending, (state) => {
                state.loading = true;
            })
            .addCase(createSurvey.fulfilled, (state, action) => {
                state.loading = false;
                state.surveys.push(action.payload.data);
                state.error = null;
            })
            .addCase(createSurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Update Survey
            .addCase(updateSurvey.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateSurvey.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.surveys.findIndex(s => s._id === action.payload.data._id);
                if (index !== -1) {
                    state.surveys[index] = action.payload.data;
                }
                state.error = null;
            })
            .addCase(updateSurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            })

            // Delete Survey
            .addCase(deleteSurvey.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteSurvey.fulfilled, (state, action) => {
                state.loading = false;
                state.surveys = state.surveys.filter(s => s._id !== action.meta.arg);
                state.error = null;
            })
            .addCase(deleteSurvey.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    }
});

export const { setCurrentSurvey, clearCurrentSurvey } = surveySlice.actions;
export default surveySlice.reducer;
