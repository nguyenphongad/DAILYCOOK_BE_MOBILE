
// Cấu hình mới sử dụng API Gateway
export const GATEWAY_PORT = 5000;
export const GATEWAY_URL = `http://localhost:${GATEWAY_PORT}`;

// Đường dẫn cho các service qua gateway
export const SERVICE_PATHS = {
    AUTH_SERVICE: 'api/auth',
};

// Cấu hình base URL để client gọi API
export const BASE_URLS = {
    // Chú ý: Không thêm "/" vào cuối để tránh lặp đường dẫn khi kết hợp với API path
    AUTH_SERVICE: `${GATEWAY_URL}/${SERVICE_PATHS.AUTH_SERVICE}`,
};
