const asyncHandler = require('express-async-handler');
const Earning = require('../models/earningModel');

/**
 * @desc    Get all earnings for a user
 * @route   GET /api/earnings
 * @access  Private
 */
const getEarnings = asyncHandler(async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  // Query parameters for filtering
  const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
  const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
  const platform = req.query.platform || null;

  // Build filter object
  const filter = { user: req.user._id };
  
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  } else if (startDate) {
    filter.date = { $gte: startDate };
  } else if (endDate) {
    filter.date = { $lte: endDate };
  }

  if (platform) {
    filter.platform = platform;
  }

  const count = await Earning.countDocuments(filter);
  
  const earnings = await Earning.find(filter)
    .sort({ date: -1 })
    .limit(pageSize)
    .skip(pageSize * (page - 1));

  res.json({
    earnings,
    page,
    pages: Math.ceil(count / pageSize),
    total: count,
  });
});

/**
 * @desc    Get earnings by ID
 * @route   GET /api/earnings/:id
 * @access  Private
 */
const getEarningById = asyncHandler(async (req, res) => {
  const earning = await Earning.findById(req.params.id);

  if (earning) {
    // Verify that the earning belongs to the logged-in user
    if (earning.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to access this earning');
    }
    
    res.json(earning);
  } else {
    res.status(404);
    throw new Error('Earning not found');
  }
});

/**
 * @desc    Create a new earning
 * @route   POST /api/earnings
 * @access  Private
 */
const createEarning = asyncHandler(async (req, res) => {
  const {
    platform,
    date,
    startTime,
    endTime,
    baseEarning,
    tips,
    bonuses,
    deliveryCount,
    startLocation,
    endLocation,
    milesDriven,
    notes,
  } = req.body;

  // Calculate total earnings
  const totalEarning = (Number(baseEarning) || 0) + (Number(tips) || 0) + (Number(bonuses) || 0);

  // Calculate hours worked
  const startTimeObj = new Date(startTime);
  const endTimeObj = new Date(endTime);
  const hoursWorked = (endTimeObj - startTimeObj) / (1000 * 60 * 60); // Convert ms to hours

  const earning = await Earning.create({
    user: req.user._id,
    platform,
    date: date || new Date(),
    startTime,
    endTime,
    baseEarning: baseEarning || 0,
    tips: tips || 0,
    bonuses: bonuses || 0,
    totalEarning,
    deliveryCount: deliveryCount || 1,
    hoursWorked,
    startLocation,
    endLocation,
    milesDriven: milesDriven || 0,
    notes,
  });

  if (earning) {
    res.status(201).json(earning);
  } else {
    res.status(400);
    throw new Error('Invalid earning data');
  }
});

/**
 * @desc    Update an earning
 * @route   PUT /api/earnings/:id
 * @access  Private
 */
const updateEarning = asyncHandler(async (req, res) => {
  const earning = await Earning.findById(req.params.id);

  if (earning) {
    // Verify that the earning belongs to the logged-in user
    if (earning.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this earning');
    }

    const {
      platform,
      date,
      startTime,
      endTime,
      baseEarning,
      tips,
      bonuses,
      deliveryCount,
      startLocation,
      endLocation,
      milesDriven,
      notes,
    } = req.body;

    // Calculate total earnings
    const totalEarning =
      (Number(baseEarning) || Number(earning.baseEarning)) +
      (Number(tips) || Number(earning.tips)) +
      (Number(bonuses) || Number(earning.bonuses));

    // Calculate hours worked
    const startTimeObj = new Date(startTime || earning.startTime);
    const endTimeObj = new Date(endTime || earning.endTime);
    const hoursWorked = (endTimeObj - startTimeObj) / (1000 * 60 * 60); // Convert ms to hours

    earning.platform = platform || earning.platform;
    earning.date = date || earning.date;
    earning.startTime = startTime || earning.startTime;
    earning.endTime = endTime || earning.endTime;
    earning.baseEarning = baseEarning || earning.baseEarning;
    earning.tips = tips || earning.tips;
    earning.bonuses = bonuses || earning.bonuses;
    earning.totalEarning = totalEarning;
    earning.deliveryCount = deliveryCount || earning.deliveryCount;
    earning.hoursWorked = hoursWorked;
    earning.startLocation = startLocation || earning.startLocation;
    earning.endLocation = endLocation || earning.endLocation;
    earning.milesDriven = milesDriven || earning.milesDriven;
    earning.notes = notes || earning.notes;

    const updatedEarning = await earning.save();
    res.json(updatedEarning);
  } else {
    res.status(404);
    throw new Error('Earning not found');
  }
});

/**
 * @desc    Delete an earning
 * @route   DELETE /api/earnings/:id
 * @access  Private
 */
const deleteEarning = asyncHandler(async (req, res) => {
  const earning = await Earning.findById(req.params.id);

  if (earning) {
    // Verify that the earning belongs to the logged-in user
    if (earning.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this earning');
    }

    await earning.deleteOne();
    res.json({ message: 'Earning removed' });
  } else {
    res.status(404);
    throw new Error('Earning not found');
  }
});

/**
 * @desc    Get earnings summary statistics
 * @route   GET /api/earnings/summary
 * @access  Private
 */
const getEarningsSummary = asyncHandler(async (req, res) => {
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

  // Get all earnings within the date range
  const earnings = await Earning.find(filter);

  // Calculate summary statistics
  const totalEarnings = earnings.reduce((sum, earning) => sum + earning.totalEarning, 0);
  const totalHours = earnings.reduce((sum, earning) => sum + earning.hoursWorked, 0);
  const totalDeliveries = earnings.reduce((sum, earning) => sum + earning.deliveryCount, 0);
  const totalMiles = earnings.reduce((sum, earning) => sum + earning.milesDriven, 0);

  // Calculate averages
  const avgEarningsPerHour = totalHours > 0 ? totalEarnings / totalHours : 0;
  const avgEarningsPerDelivery = totalDeliveries > 0 ? totalEarnings / totalDeliveries : 0;
  const avgEarningsPerMile = totalMiles > 0 ? totalEarnings / totalMiles : 0;
  const avgDeliveriesPerHour = totalHours > 0 ? totalDeliveries / totalHours : 0;

  // Group earnings by platform
  const earningsByPlatform = {};
  earnings.forEach((earning) => {
    if (!earningsByPlatform[earning.platform]) {
      earningsByPlatform[earning.platform] = 0;
    }
    earningsByPlatform[earning.platform] += earning.totalEarning;
  });

  // Group earnings by date (daily)
  const earningsByDate = {};
  earnings.forEach((earning) => {
    const dateKey = earning.date.toISOString().split('T')[0]; // YYYY-MM-DD format
    if (!earningsByDate[dateKey]) {
      earningsByDate[dateKey] = 0;
    }
    earningsByDate[dateKey] += earning.totalEarning;
  });

  res.json({
    summary: {
      totalEarnings,
      totalHours,
      totalDeliveries,
      totalMiles,
      avgEarningsPerHour,
      avgEarningsPerDelivery,
      avgEarningsPerMile,
      avgDeliveriesPerHour,
    },
    earningsByPlatform,
    earningsByDate,
    dateRange: {
      startDate,
      endDate,
    },
  });
});

module.exports = {
  getEarnings,
  getEarningById,
  createEarning,
  updateEarning,
  deleteEarning,
  getEarningsSummary,
}; 