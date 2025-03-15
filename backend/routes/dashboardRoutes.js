const express = require('express');
const { getDashboardOverview } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/dashboard
// @desc    Get dashboard overview data
// @access  Private
router.get('/', getDashboardOverview);

module.exports = router; 