const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Video = require('../models/Video');
const Report = require('../models/Report');
const ModelVersion = require('../models/ModelVersion');
const { authenticate, isAdmin } = require('../utils/jwt');

// Get dashboard statistics
router.get('/stats', authenticate, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalVideos = await Video.countDocuments();
    const fakeVideos = await Video.countDocuments({ status: 'Fake' });
    const realVideos = await Video.countDocuments({ status: 'Real' });
    const processingVideos = await Video.countDocuments({ status: 'Processing' });
    const pendingVideos = await Video.countDocuments({ status: 'Pending' });

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalVideos,
        fakeVideos,
        realVideos,
        processingVideos,
        pendingVideos,
        detectionRate: totalVideos > 0 ? ((fakeVideos + realVideos) / totalVideos * 100).toFixed(2) : 0
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: error.message
    });
  }
});

// Get all users
router.get('/users', authenticate, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: error.message
    });
  }
});

// Get all videos
router.get('/videos', authenticate, isAdmin, async (req, res) => {
  try {
    const videos = await Video.find()
      .populate('userId', 'name email')
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: videos.length,
      videos
    });

  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get videos',
      error: error.message
    });
  }
});

// Get all reports
router.get('/reports', authenticate, isAdmin, async (req, res) => {
  try {
    const reports = await Report.find()
      .populate({
        path: 'videoId',
        populate: { path: 'userId', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reports.length,
      reports
    });

  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reports',
      error: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin users'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
});

// Get model versions
router.get('/models', authenticate, isAdmin, async (req, res) => {
  try {
    const models = await ModelVersion.find().sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: models.length,
      models
    });

  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get models',
      error: error.message
    });
  }
});

// Add model version
router.post('/models', authenticate, isAdmin, async (req, res) => {
  try {
    const { modelName, version, accuracy, description } = req.body;

    const model = new ModelVersion({
      modelName,
      version,
      accuracy,
      description
    });

    await model.save();

    res.status(201).json({
      success: true,
      message: 'Model version added successfully',
      model
    });

  } catch (error) {
    console.error('Add model error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add model',
      error: error.message
    });
  }
});

module.exports = router;
