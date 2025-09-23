const mongoose = require("mongoose");

const DietTypeSchema = new mongoose.Schema(
    {
        // ví dụ: "keto", "vegan"
        keyWord: {
            type: String,
            required: true,
            unique: true,
        },
        // tên hiển thị: "Keto", "Ăn chay"
        title: {
            type: String,
            required: true
        },
        // ảnh minh hoạ
        dietTypeImage: {
            type: String,
            default: ""
        },
        // mô tả ngắn
        description: {
            type: String,
            default: ""
        },
        // mô tả chi tiết
        descriptionDetail: {
            type: String,
            default: ""
        },
        // nguồn tham khảo
        researchSource: {
            type: String,
            default: ""
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DietType", DietTypeSchema);
