const express = require('express');
const {
  getEarnings,
  getEarningById,
  createEarning,
  updateEarning,
  deleteEarning,
  getEarningsSummary,
} = require('../controllers/earningController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/earnings
// @desc    Get all earnings for a user
// @access  Private
router.get('/', getEarnings);

// @route   GET /api/earnings/summary
// @desc    Get earnings summary statistics
// @access  Private
router.get('/summary', getEarningsSummary);

// @route   POST /api/earnings
// @desc    Create a new earning
// @access  Private
router.post('/', createEarning);

// @route   GET /api/earnings/:id
// @desc    Get earning by ID
// @access  Private
router.get('/:id', getEarningById);

// @route   PUT /api/earnings/:id
// @desc    Update an earning
// @access  Private
router.put('/:id', updateEarning);

// @route   DELETE /api/earnings/:id
// @desc    Delete an earning
// @access  Private
router.delete('/:id', deleteEarning);

module.exports = router; 