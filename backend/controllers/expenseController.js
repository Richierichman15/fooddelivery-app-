const asyncHandler = require('express-async-handler');
const Expense = require('../models/expenseModel');

/**
 * @desc    Get all expenses for a user
 * @route   GET /api/expenses
 * @access  Private
 */
const getExpenses = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  // Query parameters for filtering
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  const category = req.query.category || null;

  // Build filter object
  const filter = { user: req.user._id };

  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.date = { $gte: startDate };
  } else if (endDate) {
    filter.date = { $lte: endDate };
  }

  if (category) {
    filter.category = category;
  }

  const count = await Expense.countDocuments(filter);

  const expenses = await Expense.find(filter)
    .sort({ date: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    expenses,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Get expense by ID
 * @route   GET /api/expenses/:id
 * @access  Private
 */
const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    // Verify that the expense belongs to the logged-in user
    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this expense');
    }

    res.json(expense);
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
});

/**
 * @desc    Create a new expense
 * @route   POST /api/expenses
 * @access  Private
 */
const createExpense = asyncHandler(async (req, res) => {
  const {
    date,
    category,
    amount,
    description,
    paymentMethod,
    location,
    isRecurring,
    recurringFrequency,
    taxDeductible,
    receiptImage,
  } = req.body;

  // Validate required fields
  if (!category || !amount) {
    res.status(400);
    throw new Error('Please enter all required fields');
  }

  const expense = await Expense.create({
    user: req.user._id,
    date: date || new Date(),
    category,
    amount,
    description,
    paymentMethod,
    location,
    isRecurring: isRecurring || false,
    recurringFrequency,
    taxDeductible: taxDeductible !== undefined ? taxDeductible : true,
    receiptImage,
  });

  if (expense) {
    res.status(201).json(expense);
  } else {
    res.status(400);
    throw new Error('Invalid expense data');
  }
});

/**
 * @desc    Update an expense
 * @route   PUT /api/expenses/:id
 * @access  Private
 */
const updateExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    // Verify that the expense belongs to the logged-in user
    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this expense');
    }

    const {
      date,
      category,
      amount,
      description,
      paymentMethod,
      location,
      isRecurring,
      recurringFrequency,
      taxDeductible,
      receiptImage,
    } = req.body;

    expense.date = date || expense.date;
    expense.category = category || expense.category;
    expense.amount = amount || expense.amount;
    expense.description = description || expense.description;
    expense.paymentMethod = paymentMethod || expense.paymentMethod;
    expense.location = location || expense.location;
    expense.isRecurring = isRecurring !== undefined ? isRecurring : expense.isRecurring;
    expense.recurringFrequency = recurringFrequency || expense.recurringFrequency;
    expense.taxDeductible = taxDeductible !== undefined ? taxDeductible : expense.taxDeductible;
    expense.receiptImage = receiptImage || expense.receiptImage;

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
});

/**
 * @desc    Delete an expense
 * @route   DELETE /api/expenses/:id
 * @access  Private
 */
const deleteExpense = asyncHandler(async (req, res) => {
  const expense = await Expense.findById(req.params.id);

  if (expense) {
    // Verify that the expense belongs to the logged-in user
    if (expense.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this expense');
    }

    await expense.deleteOne();
    res.json({ message: 'Expense removed' });
  } else {
    res.status(404);
    throw new Error('Expense not found');
  }
});

/**
 * @desc    Get expenses summary statistics
 * @route   GET /api/expenses/summary
 * @access  Private
 */
const getExpensesSummary = asyncHandler(async (req, res) => {
  // Get date range parameters or default to the last 30 days
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate - 30 * 24 * 60 * 60 * 1000); // 30 days before end date

  // Build filter object with date range
  const filter = {
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  };

  // Get all expenses within the date range
  const expenses = await Expense.find(filter);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

  // Calculate total tax deductible expenses
  const totalTaxDeductible = expenses
    .filter((expense) => expense.taxDeductible)
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Group expenses by category
  const expensesByCategory = {};
  expenses.forEach((expense) => {
    if (!expensesByCategory[expense.category]) {
      expensesByCategory[expense.category] = 0;
    }
    expensesByCategory[expense.category] += expense.amount;
  });

  // Group expenses by date (daily)
  const expensesByDate = {};
  expenses.forEach((expense) => {
    const dateKey = expense.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!expensesByDate[dateKey]) {
      expensesByDate[dateKey] = 0;
    }
    expensesByDate[dateKey] += expense.amount;
  });

  res.json({
    summary: {
      totalExpenses,
      totalTaxDeductible,
      percentTaxDeductible: totalExpenses > 0 ? (totalTaxDeductible / totalExpenses) * 100 : 0,
    },
    expensesByCategory,
    expensesByDate,
    dateRange: {
      startDate,
      endDate,
    },
  });
});

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpensesSummary,
}; 