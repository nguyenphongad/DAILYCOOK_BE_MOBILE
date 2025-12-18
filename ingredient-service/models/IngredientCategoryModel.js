const mongoose = require("mongoose");

const IngredientCategorySchema = new mongoose.Schema(
    {
        // Từ khóa duy nhất để dễ tìm kiếm hoặc tham chiếu
        keyword: {
            type: String,
            required: true,
            unique: true
        },
        // Tên hiển thị của danh mục (tiếng Việt)
        title: {
            type: String,
            required: true
        },
        // Tên hiển thị của danh mục (tiếng Anh)
        titleEn: {
            type: String,
            default: ""
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
