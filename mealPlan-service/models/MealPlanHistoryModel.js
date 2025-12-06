const mongoose = require('mongoose');

const mealPlanHistorySchema = new mongoose.Schema({
    dailyMealPlan_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealPlan',
        required: true,
        index: true
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
    action: {
        type: String,
        enum: ["EAT", "UNEAT"],
        required: true
    },
    portionSize: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            enum: ["gram", "kg", "ml", "liter", "portion", "piece"],
            required: true
        }
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

// Compound index cho query hiệu quả
mealPlanHistorySchema.index({ dailyMealPlan_id: 1, meal_id: 1, timestamp: -1 });
mealPlanHistorySchema.index({ user_id: 1, timestamp: -1 });

module.exports = mongoose.model('MealPlanHistory', mealPlanHistorySchema);
