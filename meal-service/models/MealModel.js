const mongoose = require('mongoose');

// Schema cho các bước nấu ăn
const stepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: true
        // Số thứ tự bước
    },
    title: {
        type: String,
        required: true
        // Tiêu đề bước
    },
    description: {
        type: String,
        required: true
        // Mô tả chi tiết bước
    },
    image: {
        type: String
        // Hình ảnh minh họa bước
    }
});

// Schema cho thành phần dinh dưỡng
const nutritionalComponentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
        // Tên tiếng Việt (VD: Năng lượng, Chất đạm, Vitamin C)
    },
    nameEn: {
        type: String
        // Tên tiếng Anh (VD: Energy, Protein, Vitamin C)
    },
    amount: {
        type: mongoose.Schema.Types.Mixed
        // Lượng dinh dưỡng (số hoặc chuỗi rỗng nếu không có)
    },
    unit_id: {
        type: String
        // ID đơn vị đo
    },
    unit_name: {
        type: String
        // Tên đơn vị đo (VD: Kcal, g, mg, μg)
    }
});

// Schema cho nguyên liệu món ăn (từ Ingredient Service)
const ingredientSchema = new mongoose.Schema({
    ingredient_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // ID tham chiếu đến Ingredient Service
    },
    quantity: {
        type: Number,
        required: true
        // Số lượng nguyên liệu
    },
    unit: {
        type: String,
        required: true
        // Đơn vị đo (gram, ml, muỗng...)
    }
});

// Schema cho nguyên liệu món ăn (từ viendinhduong.vn)
const dishComponentSchema = new mongoose.Schema({
    name: String,
    // Tên nguyên liệu
    amount: Number,
    // Số lượng
    unit: String
    // Đơn vị (VD: gram, ml, muỗng)
});

// Schema chính cho món ăn
const mealSchema = new mongoose.Schema({
    code: {
        type: String,
        unique: true,
        sparse: true
        // Mã món ăn (VD: HAP-223025, VPF-000178) - từ viendinhduong.vn
    },
    nameMeal: {
        type: String,
        required: true
        // Tên món ăn tiếng Việt
    },
    name_en: {
        type: String
        // Tên món ăn tiếng Anh
    },
    description: {
        type: String
        // Mô tả món ăn
    },
    image: {
        type: String
        // Đường dẫn hình ảnh món ăn
    },
    total_energy: {
        type: mongoose.Schema.Types.Mixed
        // Tổng năng lượng (Kcal)
    },
    category_id: {
        type: String,
        required: true
        // ID danh mục món ăn
    },
    category_name: {
        type: String
        // Tên danh mục tiếng Việt
    },
    category_name_en: {
        type: String
        // Tên danh mục tiếng Anh
    },
    category_description: {
        type: String
        // Mô tả danh mục (slug)
    },
    food_area_id: {
        type: String
        // ID khu vực ẩm thực
    },
    popularity: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
        // Độ phổ biến (1-5 sao): 1=Ít phổ biến, 5=Cực kỳ phổ biến
    },
    nutritional_components: [nutritionalComponentSchema],
    // Danh sách thành phần dinh dưỡng
    
    // === Nguyên liệu từ Ingredient Service ===
    ingredients: [ingredientSchema],
    // Danh sách nguyên liệu (tham chiếu Ingredient Service)
    
    // === Nguyên liệu từ viendinhduong.vn ===
    dish_components: [dishComponentSchema],
    // Danh sách nguyên liệu (từ API bên ngoài)
    
    // === Các trường từ Recipe cũ ===
    prepTimeMinutes: {
        type: Number
        // Thời gian chuẩn bị (phút)
    },
    cookTimeMinutes: {
        type: Number
        // Thời gian nấu (phút)
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
        // Độ khó (dễ/trung bình/khó)
    },
    steps: [stepSchema],
    // Các bước nấu ăn
    isActive: {
        type: Boolean,
        default: true
        // Trạng thái hoạt động
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

module.exports = mongoose.model('Meal', mealSchema);
