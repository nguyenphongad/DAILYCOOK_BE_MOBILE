const https = require('https');

/**
 * Proxy API lấy dữ liệu dinh dưỡng từ viendinhduong.vn
 * Giải quyết vấn đề CORS và header không hợp lệ
 * Sử dụng insecureHTTPParser: true để bỏ qua validation header nghiêm ngặt
 */
const getNutritionData = async (req, res) => {
    try {
        const { page = 1, pageSize = 15, name = '' } = req.query;

        console.log('Fetching nutrition data:', { page, pageSize, name });

        // Tạo path với query params
        const path = `/api/fe/foodNatunal/getPageFoodData?page=${page}&pageSize=${pageSize}&name=${encodeURIComponent(name)}`;

        console.log('Request path:', path);

        // Options cho https request
        const options = {
            hostname: 'viendinhduong.vn',
            path,
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            // 🔥 CỰC KỲ QUAN TRỌNG: Bỏ qua validation header nghiêm ngặt
            insecureHTTPParser: true,
            timeout: 15000
        };

        // Tạo https request
        const request = https.request(options, (response) => {
            let rawData = '';

            // Nhận data chunks
            response.on('data', (chunk) => {
                rawData += chunk;
            });

            // Khi nhận xong data
            response.on('end', () => {
                try {
                    // Parse JSON
                    const parsed = JSON.parse(rawData);
                    
                    console.log('Successfully fetched data, total results:', parsed.data?.length || 0);

                    // Trả về response
                    return res.status(200).json(parsed);
                } catch (parseError) {
                    console.error('JSON parse error:', parseError.message);
                    return res.status(500).json({
                        stype: 'ingredient',
                        status: false,
                        message: 'Lỗi parse JSON từ viendinhduong.vn',
                        error: parseError.message
                    });
                }
            });
        });

        // Xử lý lỗi request
        request.on('error', (err) => {
            console.error('Request error:', err.message);
            return res.status(500).json({
                stype: 'ingredient',
                status: false,
                message: 'Không thể kết nối đến viendinhduong.vn',
                error: err.message
            });
        });

        // Xử lý timeout
        request.on('timeout', () => {
            request.destroy();
            console.error('Request timeout');
            return res.status(408).json({
                stype: 'ingredient',
                status: false,
                message: 'Hết thời gian chờ kết nối đến viendinhduong.vn',
                error: 'Request timeout'
            });
        });

        // Kết thúc request
        request.end();

    } catch (error) {
        console.error('Nutrition proxy error:', error.message);
        return res.status(500).json({
            stype: 'ingredient',
            message: 'Lỗi khi lấy dữ liệu dinh dưỡng từ viendinhduong.vn',
            status: false,
            error: error.message
        });
    }
};

module.exports = {
    getNutritionData
};
