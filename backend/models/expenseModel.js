const mongoose = require('mongoose');

const expenseSchema = mongoose.Schema(
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
    category: {
      type: String,
      required: [true, 'Please specify the expense category'],
      enum: [
        'Fuel',
        'Maintenance',
        'Insurance',
        'Vehicle Payment',
        'Phone Bill',
        'Subscriptions',
        'Parking',
        'Tolls',
        'Food',
        'Equipment',
        'Other',
      ],
    },
    amount: {
      type: Number,
      required: [true, 'Please specify the expense amount'],
    },
    description: {
      type: String,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Debit Card', 'Credit Card', 'Digital Wallet', 'Other'],
      default: 'Credit Card',
    },
    location: {
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
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringFrequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Yearly'],
    },
    taxDeductible: {
      type: Boolean,
      default: true,
    },
    receiptImage: {
      type: String, // URL to stored image
    },
  },
  {
    timestamps: true,
  }
);

const Expense = mongoose.model('Expense', expenseSchema);

module.exports = Expense; 