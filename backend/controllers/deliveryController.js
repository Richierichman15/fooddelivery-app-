const asyncHandler = require('express-async-handler');
const Delivery = require('../models/Delivery');
const Order = require('../models/Order');
const doordashService = require('../services/doordashService');

// @desc    Create a new delivery with DoorDash
// @route   POST /api/deliveries/doordash
// @access  Private
const createDoorDashDelivery = asyncHandler(async (req, res) => {
  const { orderId, pickup, dropoff } = req.body;

  // Check if order exists
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Format delivery data for DoorDash API
  const deliveryData = {
    external_delivery_id: `DD-${orderId}-${Date.now()}`,
    pickup_address: pickup.address,
    pickup_business_name: pickup.businessName,
    pickup_phone_number: pickup.phoneNumber,
    pickup_instructions: pickup.instructions,
    dropoff_address: dropoff.address,
    dropoff_business_name: dropoff.businessName || order.customer.name,
    dropoff_phone_number: dropoff.phoneNumber,
    dropoff_instructions: dropoff.instructions,
    order_value: Math.round(order.total * 100), // Convert to cents for DoorDash
  };

  try {
    // Call DoorDash service to create delivery
    const doorDashResponse = await doordashService.createDelivery(deliveryData);

    // Create delivery record in our database
    const delivery = await Delivery.create({
      orderId,
      provider: 'doordash',
      externalDeliveryId: doorDashResponse.external_delivery_id,
      status: doorDashResponse.delivery_status,
      pickup: {
        address: pickup.address,
        businessName: pickup.businessName,
        phoneNumber: pickup.phoneNumber,
        instructions: pickup.instructions,
      },
      dropoff: {
        address: dropoff.address,
        businessName: dropoff.businessName || order.customer.name,
        phoneNumber: dropoff.phoneNumber,
        instructions: dropoff.instructions,
        contactlessDropoff: dropoff.contactlessDropoff || false,
      },
      orderValue: order.total,
      deliveryFee: doorDashResponse.fee / 100, // Convert from cents to dollars
      estimatedPickupTime: doorDashResponse.pickup_time,
      estimatedDeliveryTime: doorDashResponse.dropoff_time,
      tracking: {
        url: doorDashResponse.tracking_url,
      },
      rawResponse: doorDashResponse,
    });

    // Update order with delivery information
    order.delivery = delivery._id;
    order.deliveryStatus = delivery.status;
    await order.save();

    res.status(201).json(delivery);
  } catch (error) {
    res.status(400);
    throw new Error(`Failed to create DoorDash delivery: ${error.message}`);
  }
});

// @desc    Get delivery status
// @route   GET /api/deliveries/:id
// @access  Private
const getDeliveryStatus = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  // If it's a DoorDash delivery, get the latest status
  if (delivery.provider === 'doordash') {
    try {
      const doorDashResponse = await doordashService.getDeliveryStatus(delivery.externalDeliveryId);
      
      // Update delivery status in our database
      delivery.status = doorDashResponse.delivery_status;
      delivery.tracking.driverName = doorDashResponse.driver_name || delivery.tracking.driverName;
      delivery.tracking.driverPhoneNumber = doorDashResponse.driver_phone_number || delivery.tracking.driverPhoneNumber;
      delivery.tracking.url = doorDashResponse.tracking_url || delivery.tracking.url;
      
      if (doorDashResponse.current_location) {
        delivery.tracking.currentLocation = {
          latitude: doorDashResponse.current_location.lat,
          longitude: doorDashResponse.current_location.lng,
        };
      }
      
      // Update pickup/delivery times if available
      if (doorDashResponse.pickup_time) {
        delivery.estimatedPickupTime = doorDashResponse.pickup_time;
      }
      
      if (doorDashResponse.dropoff_time) {
        delivery.estimatedDeliveryTime = doorDashResponse.dropoff_time;
      }
      
      // Save the updated delivery
      await delivery.save();
      
      // Also update the order's delivery status
      const order = await Order.findById(delivery.orderId);
      if (order) {
        order.deliveryStatus = delivery.status;
        await order.save();
      }
    } catch (error) {
      console.error('Error updating DoorDash delivery status:', error);
      // Continue with the existing delivery data even if update fails
    }
  }

  res.json(delivery);
});

// @desc    Cancel a delivery
// @route   POST /api/deliveries/:id/cancel
// @access  Private
const cancelDelivery = asyncHandler(async (req, res) => {
  const delivery = await Delivery.findById(req.params.id);

  if (!delivery) {
    res.status(404);
    throw new Error('Delivery not found');
  }

  // Check if delivery can be canceled
  if (['delivered', 'canceled', 'failed'].includes(delivery.status)) {
    res.status(400);
    throw new Error(`Delivery cannot be canceled in status: ${delivery.status}`);
  }

  // If it's a DoorDash delivery, cancel on DoorDash
  if (delivery.provider === 'doordash') {
    try {
      await doordashService.cancelDelivery(delivery.externalDeliveryId);
      
      // Update delivery status in our database
      delivery.status = 'canceled';
      await delivery.save();
      
      // Also update the order's delivery status
      const order = await Order.findById(delivery.orderId);
      if (order) {
        order.deliveryStatus = 'canceled';
        await order.save();
      }
    } catch (error) {
      res.status(400);
      throw new Error(`Failed to cancel DoorDash delivery: ${error.message}`);
    }
  } else {
    // For other providers, just update our database
    delivery.status = 'canceled';
    await delivery.save();
    
    // Update the order's delivery status
    const order = await Order.findById(delivery.orderId);
    if (order) {
      order.deliveryStatus = 'canceled';
      await order.save();
    }
  }

  res.json({ success: true, message: 'Delivery canceled successfully' });
});

// @desc    Get all deliveries
// @route   GET /api/deliveries
// @access  Private/Admin
const getDeliveries = asyncHandler(async (req, res) => {
  const deliveries = await Delivery.find({}).sort({ createdAt: -1 });
  res.json(deliveries);
});

module.exports = {
  createDoorDashDelivery,
  getDeliveryStatus,
  cancelDelivery,
  getDeliveries,
}; 