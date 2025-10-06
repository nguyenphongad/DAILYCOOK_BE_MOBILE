/**
 * Mô hình MongoDB cho Survey
 * 
 * Schema này định nghĩa cấu trúc cho các khảo sát trong hệ thống DailyCook
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Schema cho các tùy chọn câu trả lời (dùng cho loại select, radio, checkbox)
const OptionSchema = new Schema({
  value: {
    type: String,
    required: true
  },
  label: {
    type: String,
    required: true
  }
});

// Schema chính cho Survey
const SurveySchema = new Schema({
  title: {
    type: String,
    required: [true, 'Tiêu đề khảo sát là bắt buộc'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  questionType: {
    type: String,
    required: [true, 'Loại câu hỏi là bắt buộc'],
    enum: ['text', 'select', 'radio', 'checkbox', 'rating'],
    default: 'text'
  },
  options: {
    type: [OptionSchema],
    validate: {
      validator: function(options) {
        // Yêu cầu có ít nhất 2 tùy chọn cho select, radio, checkbox
        if (['select', 'radio', 'checkbox'].includes(this.questionType)) {
          return options && options.length >= 2;
        }
        return true;
      },
      message: 'Cần có ít nhất 2 lựa chọn cho câu hỏi loại select/radio/checkbox'
    }
  },
  // Thiết lập cho câu hỏi dạng text
  textConfig: {
    maxLength: {
      type: Number,
      default: 500
    },
    placeholder: {
      type: String,
      default: 'Nhập câu trả lời của bạn'
    },
    dataType: {
      type: String,
      enum: ['all', 'text', 'number'],
      default: 'all'
    },
    allowEmpty: {
      type: Boolean,
      default: false
    },
    minLength: {
      type: Number,
      default: 0
    },
    // Thêm ràng buộc cho số nếu dataType là number
    minValue: {
      type: Number,
      default: null
    },
    maxValue: {
      type: Number,
      default: null
    }
  },
  // Thiết lập cho câu hỏi dạng rating
  ratingConfig: {
    maxStars: {
      type: Number,
      default: 5,
      min: 1,
      max: 10
    }
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware pre-save để cập nhật updatedAt
SurveySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Phương thức instance để kiểm tra một câu trả lời có hợp lệ hay không
SurveySchema.methods.validateAnswer = function(answer) {
  switch(this.questionType) {
    case 'text':
      // Kiểm tra rỗng
      if (answer === '' || answer === null || answer === undefined) {
        return this.textConfig.allowEmpty;
      }
      
      // Kiểm tra độ dài
      if (answer.length < this.textConfig.minLength || answer.length > this.textConfig.maxLength) {
        return false;
      }
      
      // Kiểm tra kiểu dữ liệu
      if (this.textConfig.dataType === 'text') {
        return typeof answer === 'string' && !/^\d+$/.test(answer);
      } else if (this.textConfig.dataType === 'number') {
        const numValue = Number(answer);
        if (isNaN(numValue)) return false;
        
        // Kiểm tra giới hạn giá trị nếu có
        if (this.textConfig.minValue !== null && numValue < this.textConfig.minValue) {
          return false;
        }
        if (this.textConfig.maxValue !== null && numValue > this.textConfig.maxValue) {
          return false;
        }
        
        return true;
      }
      
      // Nếu là kiểu all, cho phép mọi chuỗi
      return true;
    
    case 'select':
      return this.options.some(option => option.value === answer);
    
    case 'radio':
      return this.options.some(option => option.value === answer);
    
    case 'checkbox':
      if (!Array.isArray(answer)) return false;
      return answer.every(item => this.options.some(option => option.value === item));
    
    case 'rating':
      return typeof answer === 'number' && answer >= 1 && answer <= this.ratingConfig.maxStars;
    
    default:
      return false;
  }
};

// Export mô hình
module.exports = mongoose.model('Survey', SurveySchema);

/**
 * Ví dụ sử dụng:
 * 
 * // Tạo khảo sát text với ràng buộc
 * const textSurvey = new Survey({
 *   title: 'Bạn tên là gì?',
 *   description: 'Vui lòng cho biết tên đầy đủ của bạn',
 *   questionType: 'text',
 *   textConfig: {
 *     dataType: 'text',
 *     minLength: 2,
 *     maxLength: 50,
 *     allowEmpty: false,
 *     placeholder: 'Nhập tên đầy đủ của bạn'
 *   },
 *   isRequired: true,
 *   order: 1
 * });
 * 
 * await textSurvey.save();
 */
