const mongoose = require('mongoose');

const mileageSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
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
    startOdometer: {
      type: Number,
      required: [true, 'Please specify the starting odometer reading'],
    },
    endOdometer: {
      type: Number,
      required: [true, 'Please specify the ending odometer reading'],
    },
    milesDriven: {
      type: Number,
      required: [true, 'Please specify the miles driven'],
    },
    platform: {
      type: String,
      enum: ['UberEats', 'DoorDash', 'GrubHub', 'Postmates', 'Other'],
      required: [true, 'Please specify the delivery platform'],
    },
    purpose: {
      type: String,
      enum: ['Delivery', 'Commuting', 'Personal', 'Other'],
      default: 'Delivery',
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
    route: {
      type: {
        type: String,
        enum: ['LineString'],
      },
      coordinates: [[Number]],
    },
    notes: {
      type: String,
    },
    taxDeductible: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to automatically calculate miles driven
mileageSchema.pre('save', function (next) {
  if (this.startOdometer && this.endOdometer && !this.milesDriven) {
    this.milesDriven = this.endOdometer - this.startOdometer;
  }
  next();
});

const Mileage = mongoose.model('Mileage', mileageSchema);

module.exports = Mileage; 