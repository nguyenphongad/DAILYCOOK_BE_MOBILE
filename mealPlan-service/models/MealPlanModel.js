const mongoose = require('mongoose');

const mealPlanSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    date: {
        type: Date,
        required: true,
        index: true
    },
    mealPlan: [{
        servingTime: {
            type: String,
            enum: ["breakfast", "lunch", "dinner"],
            required: true
        },
        meals: [{
            meal_id: {
                type: mongoose.Schema.Types.ObjectId,
                required: true
            },
            isEaten: {
                type: Boolean,
                default: false
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
            }
        }]
    }],
    forFamily: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Index for better query performance
mealPlanSchema.index({ user_id: 1, date: 1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
