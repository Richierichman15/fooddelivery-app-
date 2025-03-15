const express = require('express');
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// @route   GET /api/expenses
// @desc    Get all expenses for a user
// @access  Private
router.get('/', getExpenses);

// @route   GET /api/expenses/summary
// @desc    Get expenses summary statistics
// @access  Private
router.get('/summary', getExpensesSummary);

// @route   POST /api/expenses
// @desc    Create a new expense
// @access  Private
router.post('/', createExpense);

// @route   GET /api/expenses/:id
// @desc    Get expense by ID
// @access  Private
router.get('/:id', getExpenseById);

// @route   PUT /api/expenses/:id
// @desc    Update an expense
// @access  Private
router.put('/:id', updateExpense);

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', deleteExpense);

module.exports = router; 