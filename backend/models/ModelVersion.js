const mongoose = require('mongoose');

const modelVersionSchema = new mongoose.Schema({
  modelName: {
    type: String,
    required: true
  },
  version: {
    type: String,
    required: true
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 100
  },
  description: {
    type: String
  },
  filePath: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ModelVersion', modelVersionSchema);
