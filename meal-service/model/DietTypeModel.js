const mongoose = require("mongoose");

// Thêm schema riêng cho thông tin dinh dưỡng
const NutritionSchema = new mongoose.Schema({
    calories: { type: Number, default: 0 }, // Calo (kcal)
    protein: { type: Number, default: 0 },  // Protein (g)
    carbs: { type: Number, default: 0 },    // Carbohydrate (g)
    fat: { type: Number, default: 0 }       // Chất béo (g)
}, { _id: false });

const DietTypeSchema = new mongoose.Schema(
    {
        // ví dụ: "keto", "vegan"
        keyword: {
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
        },
        // Thông tin dinh dưỡng khuyến nghị cho chế độ ăn
        nutrition: {
            type: NutritionSchema,
            default: () => ({
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0
            })
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("DietType", DietTypeSchema);
