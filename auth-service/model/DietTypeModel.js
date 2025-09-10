const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dietTypeSchema = new Schema({
  key_word: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  DietTypeImage: {
    type: String
  },
  description: {
    type: String
  },
  descriptionDetail: {
    type: String
  },
  researchSource: {
    type: String
  }
}, {
  timestamps: {
    createdAt: 'createAt',
    updatedAt: 'updateAt'
  }
});

const DietType = mongoose.model('DietType', dietTypeSchema);

module.exports = DietType;