const mongoose = require('mongoose');

const mealPlanHistorySchema = new mongoose.Schema({
    dailyMealPlan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPlan',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    meal_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    servingTime: {
        type: String,
        enum: ["breakfast", "lunch", "dinner"],
        required: true
    },
    lastAction: { // ĐỔI TÊN: action → lastAction
        type: String,
        enum: ["EAT", "UNEAT"],
        required: true
    },
    portionSize: {
        amount: {
            type: Number,
            required: true
        },
        unit: {
            type: String,
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Unique index: Mỗi user chỉ có 1 history record cho mỗi meal_id
mealPlanHistorySchema.index({ user_id: 1, meal_id: 1 }, { unique: true });

// Index để query nhanh
mealPlanHistorySchema.index({ user_id: 1, timestamp: -1 });
mealPlanHistorySchema.index({ user_id: 1, lastAction: 1 });

module.exports = mongoose.model('MealPlanHistory', mealPlanHistorySchema);
