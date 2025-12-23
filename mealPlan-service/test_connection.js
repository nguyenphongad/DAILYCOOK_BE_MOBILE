const axios = require('axios');
require('dotenv').config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("❌ Chưa tìm thấy GEMINI_API_KEY trong file .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

    console.log("--- ĐANG GỌI API LẤY DANH SÁCH MODEL ---");
    try {
        const response = await axios.get(url);
        const models = response.data.models;

        console.log(`✅ Kết nối thành công! Tìm thấy ${models.length} models.`);
        console.log("👇 HÃY COPY CHÍNH XÁC MỘT TRONG CÁC TÊN DƯỚI ĐÂY VÀO FILE .ENV 👇\n");

        // Lọc ra các model hỗ trợ generateContent
        const chatModels = models.filter(m => m.supportedGenerationMethods.includes("generateContent"));

        chatModels.forEach(m => {
            // In ra tên model (bỏ tiền tố models/ đi để dễ dùng)
            const shortName = m.name.replace("models/", "");
            console.log(`🔹 Tên: ${shortName}`);
            console.log(`   (Full: ${m.name})`);
        });

    } catch (error) {
        console.error("❌ LỖI NGHIÊM TRỌNG:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Message:", JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 400 && error.response.data.error.message.includes("API key not valid")) {
                console.error("=> KẾT LUẬN: API KEY CỦA BẠN KHÔNG HỢP LỆ HOẶC ĐÃ BỊ XÓA.");
            }
        } else {
            console.error(error.message);
        }
    }
}

listModels();