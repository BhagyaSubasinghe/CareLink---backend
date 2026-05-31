const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor must be linked to a user account']
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      enum: [
        'Cardiology',
        'Neurology',
        'Orthopedics',
        'Dermatology',
        'Pediatrics',
        'Psychiatry',
        'General Medicine',
        'ENT',
        'Gynecology',
        'Ophthalmology',
        'Dentistry',
        'Urology'
      ]
    },
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      unique: true,
      trim: true
    },
    experience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: 0
    },
    hospital: {
      type: String,
      required: [true, 'Hospital name is required']
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    qualifications: [
      {
        type: String,
        trim: true
      }
    ],
    availableDays: {
      type: [String],
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    consultationStartTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    consultationEndTime: {
      type: String,
      required: [true, 'End time is required'],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    slotDuration: {
      type: Number,
      required: [true, 'Slot duration is required'],
      default: 30, // in minutes
      min: 15,
      max: 60
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    profilePicture: {
      type: String,
      default: null
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Index for faster searches
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ rating: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
