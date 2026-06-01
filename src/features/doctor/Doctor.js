const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Doctor must be linked to a user account']
    },
    // Basic info
    firstName: {
      type: String,
      required: [true, 'First name is required']
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required']
    },
    email: {
      type: String,
      required: [true, 'Email is required']
    },
    phone: {
      type: String,
      required: [true, 'Phone is required']
    },
    avatar: {
      type: String,
      default: null
    },
    // Professional info
    specialty: {
      type: String,
      required: [true, 'Specialty is required'],
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
    location: {
      type: String,
      required: [true, 'Location is required']
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0
    },
    fee: {
      type: Number,
      required: [true, 'Fee is required'],
      min: 0
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500
    },
    // Education & Qualifications
    education: [
      {
        degree: String,
        institution: String,
        year: Number
      }
    ],
    qualifications: [
      {
        type: String,
        trim: true
      }
    ],
    // Availability
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
    // Appointment types
    visitTypes: {
      type: [String],
      enum: ['in-person', 'telemedicine'],
      default: ['in-person', 'telemedicine']
    },
    slots: [
      {
        type: String, // e.g., "09:00 AM", "10:30 AM"
        trim: true
      }
    ],
    // Ratings & Reviews
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    reviews: {
      type: Number,
      default: 0
    },
    // Verification & Availability
    isVerified: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    profilePicture: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

// Index for faster searches
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ location: 1 });
doctorSchema.index({ hospital: 1 });
doctorSchema.index({ rating: -1 });
doctorSchema.index({ isVerified: 1 });

module.exports = mongoose.model('Doctor', doctorSchema);
