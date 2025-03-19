const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createDoorDashDelivery,
  getDeliveryStatus,
  cancelDelivery,
  getDeliveries,
} = require('../controllers/deliveryController');

const router = express.Router();

// Get all deliveries (admin only)
router.route('/').get(protect, admin, getDeliveries);

// Create a new DoorDash delivery
router.route('/doordash').post(protect, createDoorDashDelivery);

// Get delivery status and cancel delivery
router.route('/:id').get(protect, getDeliveryStatus);
router.route('/:id/cancel').post(protect, cancelDelivery);

module.exports = router; 