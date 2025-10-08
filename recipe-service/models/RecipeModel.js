const mongoose = require('mongoose');

const stepSchema = new mongoose.Schema({
    stepNumber: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    image: {
        type: String
    }
});

const nutritionSchema = new mongoose.Schema({
    calories: {
        type: Number
    },
    protein: {
        type: Number
    },
    carbs: {
        type: Number
    },
    fat: {
        type: Number
    }
});

const recipeSchema = new mongoose.Schema({
    nameRecipe: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    recipeImage: {
        type: String
    },
    prepTimeMinutes: {
        type: Number
    },
    cookTimeMinutes: {
        type: Number
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
    },
    steps: [stepSchema],
    nutrition: nutritionSchema,
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: {
        createdAt: 'createAt',
        updatedAt: 'updateAt'
    }
});

module.exports = mongoose.model('Recipe', recipeSchema);