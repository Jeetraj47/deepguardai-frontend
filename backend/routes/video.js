const express = require('express');
const router = express.Router();
const Video = require('../models/Video');
const Report = require('../models/Report');
const { authenticate } = require('../utils/jwt');
const upload = require('../utils/fileUpload');
const { runDeepfakeDetection } = require('../utils/pythonRunner');
const { generatePDFReport } = require('../utils/reportGenerator');

// Upload video
router.post('/upload', authenticate, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    // Create video record
    const video = new Video({
      userId: req.user.id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      status: 'Pending'
    });

    await video.save();

    res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      video: {
        id: video._id,
        filename: video.originalName,
        status: video.status,
        uploadedAt: video.uploadedAt
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
});

// Analyze video
router.post('/analyze/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update status to processing
    video.status = 'Processing';
    await video.save();

    // Run AI detection (async)
    runDeepfakeDetection(video.filePath)
      .then(async (result) => {
        // Update video with results
        video.status = result.status;
        video.confidence = result.confidence;
        video.anomalies = result.anomalies || [];
        video.analysisData = result;
        video.analyzedAt = new Date();

        // Generate PDF report
        const reportData = {
          video_id: video._id,
          filename: video.originalName,
          status: result.status,
          confidence: result.confidence,
          anomalies: result.anomalies,
          frames_analyzed: result.frames_analyzed,
          processing_time: result.processing_time
        };

        const pdfPath = await generatePDFReport(reportData);
        video.reportPath = pdfPath;

        // Create report record
        const report = new Report({
          videoId: video._id,
          jsonData: reportData,
          pdfPath: pdfPath
        });

        await report.save();
        await video.save();

        console.log(`✅ Analysis completed for video ${video._id}`);
      })
      .catch(async (error) => {
        console.error('Analysis error:', error);
        video.status = 'Error';
        await video.save();
      });

    res.json({
      success: true,
      message: 'Analysis started',
      video: {
        id: video._id,
        status: video.status
      }
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Analysis failed',
      error: error.message
    });
  }
});

// Get video result
router.get('/result/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      video: {
        id: video._id,
        filename: video.originalName,
        status: video.status,
        confidence: video.confidence,
        anomalies: video.anomalies,
        reportPath: video.reportPath,
        uploadedAt: video.uploadedAt,
        analyzedAt: video.analyzedAt
      }
    });

  } catch (error) {
    console.error('Get result error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get result',
      error: error.message
    });
  }
});

// Get user's videos
router.get('/my-videos', authenticate, async (req, res) => {
  try {
    const videos = await Video.find({ userId: req.user.id })
      .sort({ uploadedAt: -1 });

    res.json({
      success: true,
      count: videos.length,
      videos: videos.map(v => ({
        id: v._id,
        filename: v.originalName,
        status: v.status,
        confidence: v.confidence,
        uploadedAt: v.uploadedAt,
        analyzedAt: v.analyzedAt
      }))
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

// Delete video
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    // Check ownership
    if (video.userId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Video.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Video deleted successfully'
    });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete video',
      error: error.message
    });
  }
});

module.exports = router;
