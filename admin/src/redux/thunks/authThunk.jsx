import { createAsyncThunk } from "@reduxjs/toolkit";
import ENDPOINT from "../../constants/Endpoint"
import { post } from "../../services/api.service"


export const loginAdmin = createAsyncThunk(
    "auth-login/user",
    async( credentialsContainer, { rejectWithValue } ) => {
        try {
            const res = await post(ENDPOINT.LOGIN_ADMIN, credentialsContainer);
            if(!res.token){
                throw new Error("Token không hợp lệ");
            }
        } catch (error) {
            if (error.response) {
                return rejectWithValue(error.response.data);
            } else {
                return rejectWithValue({ message: "Lỗi không xác định thunks - server bị lỗi/chưa khởi động" });
            }
        }
    }
);