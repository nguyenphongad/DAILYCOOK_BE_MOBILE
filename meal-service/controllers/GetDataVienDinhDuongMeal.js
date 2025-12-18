const https = require('https');

/**
 * Lấy dữ liệu món ăn từ viendinhduong.vn
 * @route GET /api/meals/getPageFoodData
 * @param {string} name - Từ khóa tìm kiếm món ăn
 * @param {number} page - Số trang (mặc định: 1)
 * @param {number} pageSize - Số lượng kết quả mỗi trang (mặc định: 15)
 * @param {number} energy - Năng lượng (mặc định: 0)
 */
const getMealDataVienDinhDuong = async (req, res) => {
    try {
        const { page = 1, pageSize = 15, name = '', energy = 0 } = req.query;

        console.log('Fetching meal data from viendinhduong.vn:', { page, pageSize, name, energy });

        // Tạo path với query params cho API món ăn
        const path = `/api/fe/tool/getPageFoodData?page=${page}&pageSize=${pageSize}&name=${encodeURIComponent(name)}&energy=${energy}`;

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
                    
                    console.log('Successfully fetched meal data, total results:', parsed.data?.length || 0);

                    // Trả về response
                    return res.status(200).json({
                        stype: 'meal',
                        status: true,
                        message: 'Lấy dữ liệu món ăn thành công',
                        data: parsed.data || [],
                        total: parsed.total || 0,
                        page: parsed.page || parseInt(page),
                        pageSize: parsed.pageSize || parseInt(pageSize)
                    });
                } catch (parseError) {
                    console.error('JSON parse error:', parseError.message);
                    return res.status(500).json({
                        stype: 'meal',
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
                stype: 'meal',
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
                stype: 'meal',
                status: false,
                message: 'Hết thời gian chờ kết nối đến viendinhduong.vn',
                error: 'Request timeout'
            });
        });

        // Kết thúc request
        request.end();

    } catch (error) {
        console.error('Meal data proxy error:', error.message);
        return res.status(500).json({
            stype: 'meal',
            message: 'Lỗi khi lấy dữ liệu món ăn từ viendinhduong.vn',
            status: false,
            error: error.message
        });
    }
};

module.exports = {
    getMealDataVienDinhDuong
};
