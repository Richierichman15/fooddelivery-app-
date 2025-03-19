const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    provider: {
      type: String,
      enum: ['doordash', 'ubereats', 'grubhub', 'self'],
      required: true,
    },
    externalDeliveryId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'pending',
        'accepted',
        'picked_up',
        'in_progress',
        'arrived',
        'delivered',
        'canceled',
        'failed',
      ],
      default: 'pending',
    },
    pickup: {
      address: {
        type: String,
        required: true,
      },
      businessName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      instructions: String,
    },
    dropoff: {
      address: {
        type: String,
        required: true,
      },
      businessName: String,
      phoneNumber: {
        type: String,
        required: true,
      },
      instructions: String,
      contactlessDropoff: {
        type: Boolean,
        default: false,
      },
    },
    orderValue: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    estimatedPickupTime: Date,
    estimatedDeliveryTime: Date,
    actualPickupTime: Date,
    actualDeliveryTime: Date,
    tracking: {
      url: String,
      driverName: String,
      driverPhoneNumber: String,
      vehicleType: String,
      vehicleColor: String,
      vehicleMake: String,
      currentLocation: {
        latitude: Number,
        longitude: Number,
      },
    },
    rawResponse: Object,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Delivery', DeliverySchema); 