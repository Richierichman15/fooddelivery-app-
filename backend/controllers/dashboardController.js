const asyncHandler = require('express-async-handler');
const Earning = require('../models/earningModel');
const Expense = require('../models/expenseModel');
const Mileage = require('../models/mileageModel');

/**
 * @desc    Get dashboard overview data
 * @route   GET /api/dashboard
 * @access  Private
 */
const getDashboardOverview = asyncHandler(async (req, res) => {
  // Get date range parameters
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of current week (Sunday)
  weekStart.setHours(0, 0, 0, 0);
  
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1); // Start of current month
  
  const yearStart = new Date(today.getFullYear(), 0, 1); // Start of current year

  // Common filter with user ID
  const userFilter = { user: req.user._id };
  
  // Today's data
  const todayFilter = { 
    ...userFilter,
    date: { $gte: todayStart }
  };
  
  const todayEarnings = await Earning.find(todayFilter);
  const todayExpenses = await Expense.find(todayFilter);
  
  // This week's data
  const weekFilter = {
    ...userFilter,
    date: { $gte: weekStart }
  };
  
  const weekEarnings = await Earning.find(weekFilter);
  const weekExpenses = await Expense.find(weekFilter);
  
  // This month's data
  const monthFilter = {
    ...userFilter,
    date: { $gte: monthStart }
  };
  
  const monthEarnings = await Earning.find(monthFilter);
  const monthExpenses = await Expense.find(monthFilter);
  
  // This year's data
  const yearFilter = {
    ...userFilter,
    date: { $gte: yearStart }
  };
  
  const yearEarnings = await Earning.find(yearFilter);
  const yearExpenses = await Expense.find(yearFilter);
  
  // Calculate summaries
  const dashboardData = {
    today: calculateSummary(todayEarnings, todayExpenses),
    week: calculateSummary(weekEarnings, weekExpenses),
    month: calculateSummary(monthEarnings, monthExpenses),
    year: calculateSummary(yearEarnings, yearExpenses),
  };

  // Get recent earnings (last 5)
  const recentEarnings = await Earning.find(userFilter)
    .sort({ date: -1 })
    .limit(5);
  
  // Get recent expenses (last 5)
  const recentExpenses = await Expense.find(userFilter)
    .sort({ date: -1 })
    .limit(5);

  // Get top performing platforms
  const platformPerformance = calculatePlatformPerformance(monthEarnings);

  // Get earnings by date (for chart) - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const last30DaysFilter = {
    ...userFilter,
    date: { $gte: thirtyDaysAgo }
  };
  
  const last30DaysEarnings = await Earning.find(last30DaysFilter);
  const earningsByDate = groupEarningsByDate(last30DaysEarnings);
  
  // Monthly summary for the year (for year chart)
  const monthlyEarnings = await getMonthlyEarnings(req.user._id, today.getFullYear());
  const monthlyExpenses = await getMonthlyExpenses(req.user._id, today.getFullYear());

  // Return all dashboard data
  res.json({
    summaries: dashboardData,
    recentActivity: {
      earnings: recentEarnings,
      expenses: recentExpenses,
    },
    platformPerformance,
    charts: {
      daily: earningsByDate,
      monthly: {
        earnings: monthlyEarnings,
        expenses: monthlyExpenses,
      }
    },
  });
});

/**
 * Calculate summary metrics from earnings and expenses
 */
const calculateSummary = (earnings, expenses) => {
  // Earnings calculations
  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.totalEarning, 0);
  const totalDeliveries = earnings.reduce((sum, earning) => sum + earning.deliveryCount, 0);
  const totalHours = earnings.reduce((sum, earning) => sum + earning.hoursWorked, 0);
  const totalMiles = earnings.reduce((sum, earning) => sum + earning.milesDriven, 0);
  
  // Expense calculations
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Derived metrics
  const netProfit = totalEarnings - totalExpenses;
  const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;
  
  const earningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
  const earningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
  const earningsPerMile = totalMiles > 0 ? totalEarnings / totalMiles : 0;
  const deliveriesPerHour = totalHours > 0 ? totalDeliveries / totalHours : 0;
  
  return {
    totalEarnings,
    totalExpenses,
    netProfit,
    profitMargin,
    totalDeliveries,
    totalHours,
    totalMiles,
    earningsPerHour,
    earningsPerDelivery,
    earningsPerMile,
    deliveriesPerHour,
  };
};

/**
 * Calculate performance metrics by platform
 */
const calculatePlatformPerformance = (earnings) => {
  const platforms = {};
  
  earnings.forEach(earning => {
    const platform = earning.platform;
    
    if (!platforms[platform]) {
      platforms[platform] = {
        totalEarnings: 0,
        totalDeliveries: 0,
        totalHours: 0,
        earningsPerHour: 0,
        earningsPerDelivery: 0,
      };
    }
    
    platforms[platform].totalEarnings += earning.totalEarning;
    platforms[platform].totalDeliveries += earning.deliveryCount;
    platforms[platform].totalHours += earning.hoursWorked;
  });
  
  // Calculate derived metrics
  Object.keys(platforms).forEach(platform => {
    const data = platforms[platform];
    
    data.earningsPerHour = data.totalHours > 0 
      ? data.totalEarnings / data.totalHours 
      : 0;
      
    data.earningsPerDelivery = data.totalDeliveries > 0 
      ? data.totalEarnings / data.totalDeliveries 
      : 0;
  });
  
  // Convert to array and sort by total earnings
  return Object.entries(platforms)
    .map(([name, metrics]) => ({ 
      platform: name, 
      ...metrics 
    }))
    .sort((a, b) => b.totalEarnings - a.totalEarnings);
};

/**
 * Group earnings by date for charts
 */
const groupEarningsByDate = (earnings) => {
  const earningsByDate = {};
  
  earnings.forEach(earning => {
    const dateKey = earning.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!earningsByDate[dateKey]) {
      earningsByDate[dateKey] = 0;
    }
    
    earningsByDate[dateKey] += earning.totalEarning;
  });
  
  // Convert to array format for charts
  return Object.entries(earningsByDate)
    .map(([date, amount]) => ({ 
      date, 
      amount 
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};

/**
 * Get monthly earnings for a year
 */
const getMonthlyEarnings = async (userId, year) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  
  const earnings = await Earning.find({
    user: userId,
    date: { $gte: yearStart, $lte: yearEnd }
  });
  
  // Initialize monthly array with zeroes
  const monthlyData = Array(12).fill(0);
  
  // Aggregate earnings by month
  earnings.forEach(earning => {
    const month = earning.date.getMonth();
    monthlyData[month] += earning.totalEarning;
  });
  
  return monthlyData;
};

/**
 * Get monthly expenses for a year
 */
const getMonthlyExpenses = async (userId, year) => {
  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year, 11, 31, 23, 59, 59);
  
  const expenses = await Expense.find({
    user: userId,
    date: { $gte: yearStart, $lte: yearEnd }
  });
  
  // Initialize monthly array with zeroes
  const monthlyData = Array(12).fill(0);
  
  // Aggregate expenses by month
  expenses.forEach(expense => {
    const month = expense.date.getMonth();
    monthlyData[month] += expense.amount;
  });
  
  return monthlyData;
};

module.exports = {
  getDashboardOverview,
}; 