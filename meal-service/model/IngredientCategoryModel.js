const mongoose = require("mongoose");

const IngredientCategorySchema = new mongoose.Schema(
    {
        // Từ khóa duy nhất để dễ tìm kiếm hoặc tham chiếu
        keyword: {
            type: String,
            required: true,
            unique: true
        },
        // Tên hiển thị của danh mục
        title: {
            type: String,
            required: true
        },
        // Mô tả thêm về danh mục
        description: {
            type: String,
            default: ""
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("IngredientCategory", IngredientCategorySchema);
