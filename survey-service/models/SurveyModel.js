const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    questionType: {
        type: String,
        enum: ['text', 'select', 'radio', 'checkbox', 'rating'],
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isRequired: {
        type: Boolean,
        default: false
    },
    order: {
        type: Number,
        required: true
    },
    options: [{
        value: String,
        label: String
    }],
    textConfig: {
        maxLength: Number,
        minLength: Number,
        placeholder: String,
        dataType: {
            type: String,
            enum: ['all', 'text', 'number']
        },
        allowEmpty: Boolean,
        minValue: Number,
        maxValue: Number
    },
    ratingConfig: {
        maxStars: Number
    },
    category: {
        type: String,
        enum: ['personalInfo', 'familyInfo', 'dietaryPreferences', 'nutritionGoals', 'waterReminders'],
        required: true
    }
}, { timestamps: true });

// Model cho câu hỏi cứng (onboarding)
const userProfileSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        unique: true
    },
    isFamily: {
        type: Boolean,
        default: false
    },
    personalInfo: {
        type: {
            height: { type: Number, default: null },
            weight: { type: Number, default: null },
            age: { type: Number, default: null },
            gender: {
                type: String,
                enum: ['male', 'female', 'other'],
                default: null
            }
        },
        default: () => ({})
    },
    familyInfo: {
        type: {
            children: { type: Number, default: null },
            teenagers: { type: Number, default: null },
            adults: { type: Number, default: null },
            elderly: { type: Number, default: null }
        },
        default: () => ({})
    },
    dietaryPreferences: {
        type: {
            DietType_id: {
                type: String,
                enum: ['normal', 'vegetarian', 'vegan', 'ketogenic', 'paleo'],
                default: null
            },
            allergies: { type: [String], default: [] },
            dislikeIngredients: { type: [String], default: [] }
        },
        default: () => ({})
    },
    nutritionGoals: {
        type: {
            caloriesPerDay: { type: Number, default: null },
            proteinPercentage: { type: Number, default: null },
            carbPercentage: { type: Number, default: null },
            fatPercentage: { type: Number, default: null },
            waterIntakeGoal: { type: Number, default: null }
        },
        default: () => ({})
    },
    waterReminders: {
        type: {
            enabled: { type: Boolean, default: false },
            frequency: { type: Number, default: null },
            startTime: { type: String, default: null },
            endTime: { type: String, default: null }
        },
        default: () => ({})
    },
    softQuestions: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: () => new Map()
    },
    isOnboardingCompleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Model cho câu hỏi mềm (survey)
const userResponseSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    responses: {
        personalInfo: {
            height: Number,
            weight: Number,
            age: Number,
            gender: {
                type: String,
                enum: ['male', 'female', 'other']
            }
        },
        familyInfo: {
            children: Number,
            teenagers: Number,
            adults: Number,
            elderly: Number
        },
        dietaryPreferences: {
            dietType: {
                type: String,
                enum: ['normal', 'vegetarian', 'vegan', 'ketogenic', 'paleo']
            },
            allergies: [String],
            dislikeIngredients: [String]
        },
        nutritionGoals: {
            caloriesPerDay: Number,
            proteinPercentage: Number,
            carbPercentage: Number,
            fatPercentage: Number,
            waterIntakeGoal: Number
        },
        waterReminders: {
            enabled: Boolean,
            frequency: Number,
            startTime: String,
            endTime: String
        }
    }
}, { timestamps: true });

const Survey = mongoose.model('Survey', surveySchema);
const UserResponse = mongoose.model('UserResponse', userResponseSchema);
const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = { Survey, UserResponse, UserProfile };
