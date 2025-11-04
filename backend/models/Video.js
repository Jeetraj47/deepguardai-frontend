const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processing', 'Fake', 'Real', 'Error'],
    default: 'Pending'
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  anomalies: [{
    type: String
  }],
  reportPath: {
    type: String,
    default: null
  },
  analysisData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  analyzedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('Video', videoSchema);
