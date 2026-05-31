const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    dosage: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['tablet', 'syrup', 'injection', 'cream', 'powder'],
      required: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    uses: {
      type: [String],
      default: [],
    },
    sideEffects: {
      type: [String],
      default: [],
    },
    requiresPrescription: {
      type: Boolean,
      default: false,
    },
    image: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Medicine', medicineSchema);
