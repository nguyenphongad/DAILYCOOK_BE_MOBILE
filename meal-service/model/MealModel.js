const mongoose = require("mongoose");
const MeasurementUnits = require("../util/MeasurementUnits");

const mealSchema = new mongoose.Schema(
    {
        // cho phép trùng tên nhưng khác cách chế biến
        nameMeal: {
            type: String,
            default: "",
        },

        description: {
            type: String,
            default: "",
        },

        mealCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MealCategory",
            required: true,
        },

        mealImage: {
            type: String,
            default: "",
        },

        dietaryCompatibility: [
            { type: mongoose.Schema.Types.ObjectId, ref: "DietType" },
        ],

        ingredients: [
            {
                ingredient_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Ingredient",
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                unit: {
                    type: String,
                    enum: Object.values(MeasurementUnits),
                    required: true,
                },
            },
        ],

        recipe:
        {
            recipe_id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Recipe",
                required: true,
            },
            cookingEffect: {
                calo: { type: Number, min: 0 },
                protein: { type: Number, min: 0 },
                carb: { type: Number, min: 0 },
                fat: { type: Number, min: 0 },
            },
        },

        popularity: {
            type: Number,
            default: 1,
            min: [1, 'Độ phổ biến phải từ 1 đến 5'],
            max: [5, 'Độ phổ biến phải từ 1 đến 5'],
            validate: {
                validator: function(v) {
                    return Number.isInteger(v) && v >= 1 && v <= 5;
                },
                message: 'Độ phổ biến phải là số nguyên từ 1 đến 5'
            }
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: { createdAt: "createAt", updatedAt: "updateAt" },
    }
);

module.exports = mongoose.model("Meal", mealSchema);
