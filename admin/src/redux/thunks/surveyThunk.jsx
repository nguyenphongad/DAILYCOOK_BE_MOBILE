import { createAsyncThunk } from '@reduxjs/toolkit';
import { get, post, put, del } from "../../services/api.service";
import ENDPOINT from '../../constants/Endpoint';

export const getAllSurveysAdmin = createAsyncThunk(
    'survey/getAllSurveysAdmin',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await get(ENDPOINT.GET_ALL_SURVEYS, auth.token);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || {
                type: "GET_ALL_SURVEYS_ADMIN",
                status: false,
                message: "Lỗi khi lấy danh sách khảo sát"
            });
        }
    }
);

export const createSurvey = createAsyncThunk(
    'survey/createSurvey',
    async (surveyData, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await post(ENDPOINT.CREATE_SURVEY, surveyData, auth.token);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || {
                type: "CREATE_SURVEY",
                status: false,
                message: "Lỗi khi tạo khảo sát"
            });
        }
    }
);

export const updateSurvey = createAsyncThunk(
    'survey/updateSurvey',
    async ({ id, updateData }, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await put(`${ENDPOINT.UPDATE_SURVEY}/${id}`, updateData, auth.token);
            return response;
        } catch (error) {
            return rejectWithValue(error.response?.data || {
                type: "UPDATE_SURVEY",
                status: false,
                message: "Lỗi khi cập nhật khảo sát"
            });
        }
    }
);

export const deleteSurvey = createAsyncThunk(
    'survey/deleteSurvey',
    async (id, { getState, rejectWithValue }) => {
        try {
            const { auth } = getState();
            const response = await del(`${ENDPOINT.DELETE_SURVEY}/${id}`, auth.token);
            return { ...response, id };
        } catch (error) {
            return rejectWithValue(error.response?.data || {
                type: "DELETE_SURVEY",
                status: false,
                message: "Lỗi khi xóa khảo sát"
            });
        }
    }
);
