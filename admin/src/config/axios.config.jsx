import axios from "axios";
import { BASE_URLS } from "./index";

const apiServiceInstance = axios.create({
    baseURL: BASE_URLS.AUTH_SERVICE,
});

apiServiceInstance.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            console.error('Lỗi Response:', {
                status: error.response.status,
                data: error.response.data,
                message: error.message,
            });
        } else if (error.request) {
            console.error('Lỗi Request:', error.request);
        } else {
            console.error('Lỗi:', error.message);
        }
        return Promise.reject(error);
    }
);

export default apiServiceInstance;
