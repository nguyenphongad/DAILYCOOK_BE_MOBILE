const mongoose = require("mongoose");
const MeasurementUnits = require("../util/MeasurementUnits");

// Schema cho thành phần dinh dưỡng
const NutritionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
        // Tên tiếng Việt (VD: Protein, Carbohydrate by difference)
    },
    name_en: {
        type: String
        // Tên tiếng Anh (VD: Protein, Carbohydrate by difference)
    },
    value: {
        type: Number,
        default: 0
        // Giá trị dinh dưỡng
    },
    unit: {
        type: String
        // Đơn vị đo (VD: g, mg, mcg)
    }
});

// Schema chính cho nguyên liệu
const IngredientSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            unique: true,
            sparse: true
            // Mã nguyên liệu (VD: 10001)
        },
        // Tên nguyên liệu tiếng Việt
        nameIngredient: {
            type: String,
            required: true
        },
        // Tên nguyên liệu tiếng Anh
        name_en: {
            type: String
        },
        // Mô tả ngắn
        description: {
            type: String,
            default: ""
        },
        // Tham chiếu đến danh mục nguyên liệu
        ingredientCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "IngredientCategory"
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
            enum: Object.keys(MeasurementUnits),
            default: MeasurementUnits.GRAM
        },
        // Năng lượng (Kcal)
        energy: {
            type: Number,
            default: 0
        },
        // Danh sách thành phần dinh dưỡng chi tiết
        nutrition: [NutritionSchema],
        // Các cách sử dụng phổ biến (ví dụ: xào, nấu canh, ăn sống…)
        commonUses: {
            type: [String],
            default: []
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Ingredient", IngredientSchema);
