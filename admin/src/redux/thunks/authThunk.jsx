import { createAsyncThunk } from "@reduxjs/toolkit";
import ENDPOINT from "../../constants/Endpoint"
import { post } from "../../services/api.service"


export const loginAdmin = createAsyncThunk(
    "auth-login/user",
    async( credentialsContainer, { rejectWithValue } ) => {
        console.log(ENDPOINT.LOGIN_ADMIN)

        try {
            const res = await post(ENDPOINT.LOGIN_ADMIN, credentialsContainer);
            if(!res.token){
                throw new Error("Token không hợp lệ");
            }
            return res; // Trả về response cho reducer
        } catch (error) {
            if (error.response) {
                return rejectWithValue(error.response.data);
            } else {
                return rejectWithValue({ message: "Lỗi kết nối đến server. Vui lòng kiểm tra lại server và kết nối mạng." });
            }
        }
    }
);