const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Patient is required']
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: [true, 'Doctor is required']
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required']
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
      match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    symptoms: {
      type: String,
      required: [true, 'Please describe your symptoms'],
      trim: true,
      maxlength: 500
    },
    consultationType: {
      type: String,
      enum: ['In-Person', 'Online', 'Phone'],
      default: 'In-Person',
      required: true
    },
    status: {
      type: String,
      enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show'],
      default: 'Scheduled'
    },
    consultationFee: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Refunded'],
      default: 'Pending'
    },
    paymentId: {
      type: String,
      default: null
    },
    prescription: {
      type: String,
      default: null
    },
    notes: {
      type: String,
      default: null,
      maxlength: 1000
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: null
    },
    review: {
      type: String,
      default: null,
      maxlength: 500
    },
    reminderSent: {
      type: Boolean,
      default: false
    },
    joinUrl: {
      type: String, // For online consultations
      default: null
    },
    cancellationReason: {
      type: String,
      default: null
    },
    rescheduledFrom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      default: null
    }
  },
  { timestamps: true }
);

// Index for faster queries
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ doctor: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
