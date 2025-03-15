const asyncHandler = require('express-async-handler');
const Earning = require('../models/earningModel');
const Expense = require('../models/expenseModel');
const Mileage = require('../models/mileageModel');

/**
 * @desc    Calculate profit metrics (income vs. expenses)
 * @route   GET /api/analytics/profit
 * @access  Private
 */
const getProfitMetrics = asyncHandler(async (req, res) => {
  // Get date range parameters or default to the last 30 days
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate - 30 * 24 * 60 * 60 * 1000); // 30 days before end date

  // Common filter object with date range
  const dateFilter = {
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  };

  // Get all earnings within the date range
  const earnings = await Earning.find(dateFilter);
  
  // Get all expenses within the date range
  const expenses = await Expense.find(dateFilter);

  // Calculate total earnings
  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.totalEarning, 0);
  
  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Calculate net profit
  const netProfit = totalEarnings - totalExpenses;
  
  // Calculate profit margin percentage
  const profitMargin = totalEarnings > 0 ? (netProfit / totalEarnings) * 100 : 0;

  // Group profits by date
  const profitByDate = {};
  
  // First, add all earnings by date
  earnings.forEach((earning) => {
    const dateKey = earning.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!profitByDate[dateKey]) {
      profitByDate[dateKey] = {
        earnings: 0,
        expenses: 0,
        profit: 0,
      };
    }
    profitByDate[dateKey].earnings += earning.totalEarning;
  });
  
  // Then, subtract expenses by date
  expenses.forEach((expense) => {
    const dateKey = expense.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!profitByDate[dateKey]) {
      profitByDate[dateKey] = {
        earnings: 0,
        expenses: 0,
        profit: 0,
      };
    }
    profitByDate[dateKey].expenses += expense.amount;
  });
  
  // Calculate profit for each date
  Object.keys(profitByDate).forEach((date) => {
    profitByDate[date].profit = profitByDate[date].earnings - profitByDate[date].expenses;
  });

  res.json({
    summary: {
      totalEarnings,
      totalExpenses,
      netProfit,
      profitMargin,
    },
    profitByDate,
    dateRange: {
      startDate,
      endDate,
    },
  });
});

/**
 * @desc    Get performance metrics by platform
 * @route   GET /api/analytics/platform-performance
 * @access  Private
 */
const getPlatformPerformance = asyncHandler(async (req, res) => {
  // Get date range parameters or default to the last 30 days
  const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
  const startDate = req.query.startDate
    ? new Date(req.query.startDate)
    : new Date(endDate - 30 * 24 * 60 * 60 * 1000); // 30 days before end date

  // Filter object with date range
  const filter = {
    user: req.user._id,
    date: { $gte: startDate, $lte: endDate },
  };

  // Get all earnings within the date range
  const earnings = await Earning.find(filter);

  // Group metrics by platform
  const platformMetrics = {};

  // Process each earning to extract metrics by platform
  earnings.forEach((earning) => {
    const platform = earning.platform;
    
    if (!platformMetrics[platform]) {
      platformMetrics[platform] = {
        totalEarnings: 0,
        totalDeliveries: 0,
        totalHours: 0,
        totalMiles: 0,
        earningsPerHour: 0,
        earningsPerDelivery: 0,
        earningsPerMile: 0,
        deliveriesPerHour: 0,
      };
    }
    
    platformMetrics[platform].totalEarnings += earning.totalEarning;
    platformMetrics[platform].totalDeliveries += earning.deliveryCount;
    platformMetrics[platform].totalHours += earning.hoursWorked;
    platformMetrics[platform].totalMiles += earning.milesDriven;
  });

  // Calculate derived metrics for each platform
  Object.keys(platformMetrics).forEach((platform) => {
    const metrics = platformMetrics[platform];
    
    metrics.earningsPerHour = metrics.totalHours > 0 
      ? metrics.totalEarnings / metrics.totalHours 
      : 0;
      
    metrics.earningsPerDelivery = metrics.totalDeliveries > 0 
      ? metrics.totalEarnings / metrics.totalDeliveries 
      : 0;
      
    metrics.earningsPerMile = metrics.totalMiles > 0 
      ? metrics.totalEarnings / metrics.totalMiles 
      : 0;
      
    metrics.deliveriesPerHour = metrics.totalHours > 0 
      ? metrics.totalDeliveries / metrics.totalHours 
      : 0;
  });

  res.json({
    platformMetrics,
    dateRange: {
      startDate,
      endDate,
    },
  });
});

/**
 * @desc    Get optimal working hours based on historical earnings
 * @route   GET /api/analytics/optimal-hours
 * @access  Private
 */
const getOptimalHours = asyncHandler(async (req, res) => {
  // Get all user earnings
  const earnings = await Earning.find({ user: req.user._id });
  
  if (earnings.length === 0) {
    return res.json({
      message: 'Not enough earnings data to calculate optimal hours',
      optimalHours: [],
      hourlyEarnings: {},
    });
  }

  // Initialize data structure for hourly earnings
  const hourlyEarnings = {};
  const daysOfWeek = [0, 1, 2, 3, 4, 5, 6]; // 0 = Sunday, 6 = Saturday
  daysOfWeek.forEach(day => {
    hourlyEarnings[day] = {};
    for (let hour = 0; hour < 24; hour++) {
      hourlyEarnings[day][hour] = {
        totalEarnings: 0,
        totalHours: 0,
        count: 0,
        avgEarningsPerHour: 0,
      };
    }
  });

  // Process each earning to calculate hourly performance
  earnings.forEach(earning => {
    const startTime = new Date(earning.startTime);
    const endTime = new Date(earning.endTime);
    const dayOfWeek = startTime.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Get hours between start and end time
    const startHour = startTime.getHours();
    const endHour = endTime.getHours();
    
    // Calculate earnings per hour for this session
    const earningsPerHour = earning.totalEarning / earning.hoursWorked;
    
    // Distribute the earnings across the hours worked
    // Simple approach: assume equal distribution of earnings across all hours worked
    for (let hour = startHour; hour <= endHour; hour++) {
      const hourIndex = hour % 24; // handle overnight shifts
      
      hourlyEarnings[dayOfWeek][hourIndex].totalEarnings += earningsPerHour;
      hourlyEarnings[dayOfWeek][hourIndex].totalHours += 1; // Count one hour
      hourlyEarnings[dayOfWeek][hourIndex].count += 1;
    }
  });

  // Calculate average earnings per hour for each day/hour combination
  daysOfWeek.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      const hourData = hourlyEarnings[day][hour];
      hourData.avgEarningsPerHour = hourData.count > 0 
        ? hourData.totalEarnings / hourData.count 
        : 0;
    }
  });

  // Find the top performing hours
  const allHourlyData = [];
  daysOfWeek.forEach(day => {
    for (let hour = 0; hour < 24; hour++) {
      if (hourlyEarnings[day][hour].count > 0) {
        allHourlyData.push({
          day,
          hour,
          avgEarningsPerHour: hourlyEarnings[day][hour].avgEarningsPerHour,
          count: hourlyEarnings[day][hour].count,
        });
      }
    }
  });

  // Sort by average earnings per hour (descending)
  allHourlyData.sort((a, b) => b.avgEarningsPerHour - a.avgEarningsPerHour);

  // Get top 10 most profitable hours
  const optimalHours = allHourlyData.slice(0, 10);

  // Map day numbers to day names for better readability
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const formattedOptimalHours = optimalHours.map(({ day, hour, avgEarningsPerHour, count }) => ({
    day: dayNames[day],
    hour: `${hour}:00 - ${hour + 1}:00`,
    avgEarningsPerHour,
    confidence: Math.min(1, count / 5), // Confidence based on data points (max at 5 occurrences)
  }));

  res.json({
    optimalHours: formattedOptimalHours,
    hourlyEarnings,
  });
});

/**
 * @desc    Predict weekly earnings based on past performance
 * @route   GET /api/analytics/earnings-prediction
 * @access  Private
 */
const predictEarnings = asyncHandler(async (req, res) => {
  // Get historical earnings data
  const earnings = await Earning.find({ user: req.user._id }).sort('date');
  
  if (earnings.length < 7) {
    return res.json({
      message: 'Not enough historical data for accurate predictions',
      predictions: [],
      confidence: 'low',
    });
  }

  // Group earnings by week
  const weeklyEarnings = {};
  
  earnings.forEach(earning => {
    const date = new Date(earning.date);
    const year = date.getFullYear();
    const week = getWeekNumber(date);
    const weekKey = `${year}-${week}`;
    
    if (!weeklyEarnings[weekKey]) {
      weeklyEarnings[weekKey] = {
        totalEarnings: 0,
        totalHours: 0,
        totalDeliveries: 0,
        year,
        week,
      };
    }
    
    weeklyEarnings[weekKey].totalEarnings += earning.totalEarning;
    weeklyEarnings[weekKey].totalHours += earning.hoursWorked;
    weeklyEarnings[weekKey].totalDeliveries += earning.deliveryCount;
  });

  // Convert to array and sort by date
  const weeklyEarningsArray = Object.values(weeklyEarnings).sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.week - b.week;
  });

  // Simple moving average prediction for next week
  const recentWeeks = weeklyEarningsArray.slice(-4); // Use last 4 weeks
  
  if (recentWeeks.length < 4) {
    return res.json({
      message: 'Not enough weekly data for accurate predictions',
      predictions: [],
      confidence: 'low',
    });
  }
  
  const avgEarnings = recentWeeks.reduce((sum, week) => sum + week.totalEarnings, 0) / recentWeeks.length;
  const avgHours = recentWeeks.reduce((sum, week) => sum + week.totalHours, 0) / recentWeeks.length;
  const avgDeliveries = recentWeeks.reduce((sum, week) => sum + week.totalDeliveries, 0) / recentWeeks.length;
  
  // Calculate variance to determine prediction confidence
  const earningsVariance = calculateVariance(recentWeeks.map(w => w.totalEarnings));
  const coefficientOfVariation = Math.sqrt(earningsVariance) / avgEarnings;
  
  let confidence = 'medium';
  if (coefficientOfVariation < 0.15) {
    confidence = 'high';
  } else if (coefficientOfVariation > 0.3) {
    confidence = 'low';
  }

  // Last week's data
  const lastWeek = recentWeeks[recentWeeks.length - 1];
  const lastWeekDate = getDateOfWeek(lastWeek.week, lastWeek.year);
  
  // Next week prediction
  const nextWeekDate = new Date(lastWeekDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  const predictedNext = {
    week: getWeekNumber(nextWeekDate),
    year: nextWeekDate.getFullYear(),
    totalEarnings: avgEarnings,
    totalHours: avgHours,
    totalDeliveries: avgDeliveries,
    startDate: nextWeekDate,
  };
  
  // Week after next prediction (simple trend-based)
  const twoWeeksDate = new Date(nextWeekDate);
  twoWeeksDate.setDate(twoWeeksDate.getDate() + 7);
  
  // Simple trend calculation
  const trend = calculateTrend(recentWeeks.map(w => w.totalEarnings));
  
  const predictedTwoWeeks = {
    week: getWeekNumber(twoWeeksDate),
    year: twoWeeksDate.getFullYear(),
    totalEarnings: avgEarnings + trend,
    totalHours: avgHours, // Assume same hours
    totalDeliveries: avgDeliveries, // Assume same deliveries
    startDate: twoWeeksDate,
  };

  res.json({
    historicalWeekly: weeklyEarningsArray,
    predictions: [predictedNext, predictedTwoWeeks],
    confidence,
  });
});

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Helper function to get the date of a week
function getDateOfWeek(week, year) {
  const januaryFirst = new Date(year, 0, 1);
  const daysOffset = (januaryFirst.getDay() > 0) 
    ? 8 - januaryFirst.getDay() 
    : 1;
  const firstMonday = new Date(year, 0, daysOffset);
  
  if (week == 1 && firstMonday.getDate() > 1) {
    return new Date(year, 0, 1);
  }
  
  const weeksOffset = week - 1;
  return new Date(firstMonday.getTime() + weeksOffset * 7 * 24 * 60 * 60 * 1000);
}

// Helper function to calculate variance
function calculateVariance(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  return squareDiffs.reduce((sum, value) => sum + value, 0) / values.length;
}

// Helper function to calculate trend
function calculateTrend(values) {
  if (values.length < 2) return 0;
  
  // Simple linear trend: average week-to-week change
  let totalChange = 0;
  for (let i = 1; i < values.length; i++) {
    totalChange += values[i] - values[i-1];
  }
  
  return totalChange / (values.length - 1);
}

module.exports = {
  getProfitMetrics,
  getPlatformPerformance,
  getOptimalHours,
  predictEarnings,
}; 