const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  fullName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordAdmin:{
    type: String,
    required: true,
  },
  google_id: {
    type: String
  },
  userImage: {
    type: String
  },
  phoneNumber: {
    type: String
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isFamily: {
    type: Boolean,
    default: false
  },
  personalInfo: {
    height: {
      type: Number, // cm
    },
    weight: {
      type: Number, // kg
    },
    age: {
      type: Number
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other']
    }
  },
  familyInfo: {
    children: {
      type: Number,
      default: 0
    },
    teenagers: {
      type: Number,
      default: 0
    },
    adults: {
      type: Number,
      default: 1
    },
    elderly: {
      type: Number,
      default: 0
    }
  },
  dietaryPreferences: {
    dietType: {
      type: Schema.Types.ObjectId,
      ref: 'DietType'
    },
    allergies: [{
      type: String
    }],
    dislikeIngredients: [{
      type: String
    }]
  },
  nutritionGoals: {
    caloriesPerDay: {
      type: Number
    },
    proteinPercentage: {
      type: Number
    },
    carbPercentage: {
      type: Number
    },
    fatPercentage: {
      type: Number
    },
    waterIntakeGoal: {
      type: Number
    }
  },
  waterReminders: {
    enabled: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: Number, // giờ
    },
    startTime: {
      type: String // format "HH:MM"
    },
    endTime: {
      type: String // format "HH:MM"
    }
  },
  isOnboardingCompleted: {
    type: Boolean,
    default: false
  },
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

const User = mongoose.model('User', userSchema);

module.exports = User;