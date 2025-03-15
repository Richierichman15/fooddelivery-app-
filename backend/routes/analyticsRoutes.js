const express = require('express');
const {
  getProfitMetrics,
  getPlatformPerformance,
  getOptimalHours,
  predictEarnings,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/analytics/profit
// @desc    Calculate profit metrics (income vs. expenses)
// @access  Private
router.get('/profit', getProfitMetrics);

// @route   GET /api/analytics/platform-performance
// @desc    Get performance metrics by platform
// @access  Private
router.get('/platform-performance', getPlatformPerformance);

// @route   GET /api/analytics/optimal-hours
// @desc    Get optimal working hours based on historical earnings
// @access  Private
router.get('/optimal-hours', getOptimalHours);

// @route   GET /api/analytics/earnings-prediction
// @desc    Predict weekly earnings based on past performance
// @access  Private
router.get('/earnings-prediction', predictEarnings);

module.exports = router; 