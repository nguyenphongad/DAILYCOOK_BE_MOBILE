import { createAsyncThunk } from "@reduxjs/toolkit";
import ENDPOINT from "../../constants/Endpoint"
import { post, get } from "../../services/api.service"


export const loginAdmin = createAsyncThunk(
    "auth-login/user",
    async (credentialsContainer, { rejectWithValue }) => {
        console.log(ENDPOINT.LOGIN_ADMIN)

        try {
            const res = await post(ENDPOINT.LOGIN_ADMIN, credentialsContainer);
            if (!res.token) {
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

export const checkToken = createAsyncThunk(
    "auth-checkToken/user",
    async (token, { rejectWithValue }) => {
        try {
            // console.log(token);

            if (!token) {
                return rejectWithValue({ message: "Không có token" });
            }

            const res = await get(ENDPOINT.CHECK_TOKEN, token);

            // console.log("Dữ liệu trả về từ API:", res.data);


            return res.data;
        } catch (error) {
            console.error("Lỗi khi gọi checkToken API:", error.response || error.message);

            return rejectWithValue(error.response?.data || { message: "Lỗi không xác định thunks - server bị lỗi/chưa khởi động" });
        }
    }
);