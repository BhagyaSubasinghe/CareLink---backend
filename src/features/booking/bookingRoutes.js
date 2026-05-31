const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  getAllDoctors,
  getDoctorProfile,
  getAvailableSlots,
  bookAppointment,
  getMyAppointments,
  getAppointmentDetails,
  cancelAppointment,
  addReview
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Validation middleware
 */
const validateErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Public Routes
 */

// GET /api/v1/booking/doctors
// Get all available doctors with filtering
router.get('/doctors', getAllDoctors);

// GET /api/v1/booking/doctors/:id
// Get specific doctor profile
router.get('/doctors/:id', getDoctorProfile);

// GET /api/v1/booking/available-slots/:doctorId/:date
// Get available time slots for a doctor on specific date
router.get('/available-slots/:doctorId/:date', getAvailableSlots);

/**
 * Protected Routes (Require Authentication)
 */

// POST /api/v1/booking/appointments
// Book an appointment
router.post(
  '/appointments',
  protect,
  [
    body('doctorId')
      .notEmpty().withMessage('Doctor ID is required'),
    body('appointmentDate')
      .notEmpty().withMessage('Appointment date is required')
      .isISO8601().withMessage('Invalid date format'),
    body('startTime')
      .notEmpty().withMessage('Start time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('symptoms')
      .notEmpty().withMessage('Please describe your symptoms')
      .trim()
      .isLength({ min: 10, max: 500 }).withMessage('Symptoms must be between 10 and 500 characters'),
    body('consultationType')
      .optional()
      .isIn(['In-Person', 'Online', 'Phone']).withMessage('Invalid consultation type')
  ],
  validateErrors,
  bookAppointment
);

// GET /api/v1/booking/my-appointments
// Get user's appointments
router.get('/my-appointments', protect, getMyAppointments);

// GET /api/v1/booking/appointments/:id
// Get appointment details
router.get('/appointments/:id', protect, getAppointmentDetails);

// PUT /api/v1/booking/appointments/:id/cancel
// Cancel an appointment
router.put(
  '/appointments/:id/cancel',
  protect,
  [
    body('cancellationReason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Cancellation reason must not exceed 500 characters')
  ],
  validateErrors,
  cancelAppointment
);

// PUT /api/v1/booking/appointments/:id/review
// Add review and rating for appointment
router.put(
  '/appointments/:id/review',
  protect,
  [
    body('rating')
      .notEmpty().withMessage('Rating is required')
      .isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
    body('review')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Review must not exceed 500 characters')
  ],
  validateErrors,
  addReview
);

module.exports = router;
