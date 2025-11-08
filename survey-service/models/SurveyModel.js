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
        height: Number, // cm
        weight: Number, // kg
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
        DietType_id: {
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
    },
    softQuestions: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
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
