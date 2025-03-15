const mongoose = require('mongoose');

const earningSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    platform: {
      type: String,
      required: [true, 'Please specify the delivery platform'],
      enum: ['UberEats', 'DoorDash', 'GrubHub', 'Postmates', 'Other'],
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date'],
      default: Date.now,
    },
    startTime: {
      type: Date,
      required: [true, 'Please specify the start time'],
    },
    endTime: {
      type: Date,
      required: [true, 'Please specify the end time'],
    },
    baseEarning: {
      type: Number,
      required: [true, 'Please specify the base earning'],
      default: 0,
    },
    tips: {
      type: Number,
      default: 0,
    },
    bonuses: {
      type: Number,
      default: 0,
    },
    totalEarning: {
      type: Number,
      required: [true, 'Please specify the total earning'],
    },
    deliveryCount: {
      type: Number,
      required: [true, 'Please specify how many deliveries were made'],
      default: 1,
    },
    hoursWorked: {
      type: Number,
      required: [true, 'Please specify the hours worked'],
    },
    startLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      address: String,
    },
    endLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
      address: String,
    },
    milesDriven: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for calculating earnings per hour
earningSchema.virtual('earningsPerHour').get(function() {
  return this.totalEarning / this.hoursWorked;
});

// Virtual for calculating earnings per delivery
earningSchema.virtual('earningsPerDelivery').get(function() {
  return this.totalEarning / this.deliveryCount;
});

// Virtual for calculating earnings per mile
earningSchema.virtual('earningsPerMile').get(function() {
  if (this.milesDriven === 0) return 0;
  return this.totalEarning / this.milesDriven;
});

// Enable virtuals in JSON
earningSchema.set('toJSON', { virtuals: true });
earningSchema.set('toObject', { virtuals: true });

const Earning = mongoose.model('Earning', earningSchema);

module.exports = Earning; 