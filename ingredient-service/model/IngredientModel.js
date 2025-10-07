const mongoose = require("mongoose");
const MeasurementUnits = require("../util/MeasurementUnits");

// Schema riêng cho giá trị dinh dưỡng
const NutritionSchema = new mongoose.Schema({
    calories: { type: Number, default: 0 }, // năng lượng (kcal)
    protein: { type: Number, default: 0 },  // protein (g)
    carbs: { type: Number, default: 0 },    // carbohydrate (g)
    fat: { type: Number, default: 0 }       // chất béo (g)
});

// Schema chính cho nguyên liệu
const IngredientSchema = new mongoose.Schema(
    {
        // Tên nguyên liệu
        nameIngredient: {
            type: String,
            required: true
        },
        // Mô tả ngắn
        description: {
            type: String,
            default: ""
        },
        // Tham chiếu đến danh mục nguyên liệu
        ingredientCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "IngredientCategory",
            required: true
        },
        // Ảnh minh họa
        ingredientImage: {
            type: String,
            default: ""
        },
        // Lượng mặc định
        defaultAmount: {
            type: Number,
            default: 100
        },
        // Đơn vị mặc định (lấy từ MeasurementUnits)
        defaultUnit: {
            type: String,
            enum: Object.keys(MeasurementUnits), // dùng tất cả giá trị trong MeasurementUnits
            default: MeasurementUnits.GRAM
        },
        // Thông tin dinh dưỡng
        nutrition: {
            type: NutritionSchema,
            default: () => ({})
        },
        // Các cách sử dụng phổ biến (ví dụ: xào, nấu canh, ăn sống…)
        commonUses: {
            type: [String],
            default: []
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Ingredient", IngredientSchema);
