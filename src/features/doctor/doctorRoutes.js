const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  registerDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAppointments,
  getAppointmentDetail,
  completeAppointment,
  getAnalytics
} = require('../controllers/doctorController');
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
 * Protected Routes (Require Authentication)
 */

// POST /api/v1/doctors/register
// Register as a doctor
router.post(
  '/register',
  protect,
  [
    body('specialization')
      .notEmpty().withMessage('Specialization is required')
      .isIn([
        'Cardiology', 'Neurology', 'Orthopedics', 'Dermatology',
        'Pediatrics', 'Psychiatry', 'General Medicine', 'ENT',
        'Gynecology', 'Ophthalmology', 'Dentistry', 'Urology'
      ]).withMessage('Invalid specialization'),
    body('licenseNumber')
      .notEmpty().withMessage('License number is required')
      .isLength({ min: 5 }).withMessage('Invalid license number'),
    body('experience')
      .notEmpty().withMessage('Experience is required')
      .isInt({ min: 0 }).withMessage('Experience must be a positive number'),
    body('hospital')
      .notEmpty().withMessage('Hospital/Clinic name is required')
      .trim()
      .isLength({ min: 3, max: 100 }).withMessage('Hospital name must be between 3 and 100 characters'),
    body('consultationFee')
      .notEmpty().withMessage('Consultation fee is required')
      .isInt({ min: 0 }).withMessage('Consultation fee must be a positive number'),
    body('consultationStartTime')
      .notEmpty().withMessage('Start time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('consultationEndTime')
      .notEmpty().withMessage('End time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('slotDuration')
      .optional()
      .isInt({ min: 15, max: 60 }).withMessage('Slot duration must be between 15 and 60 minutes'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('qualifications')
      .optional()
      .isArray().withMessage('Qualifications must be an array')
  ],
  validateErrors,
  registerDoctor
);

// GET /api/v1/doctors/profile
// Get doctor's profile
router.get('/profile', protect, getDoctorProfile);

// PUT /api/v1/doctors/profile
// Update doctor's profile
router.put(
  '/profile',
  protect,
  [
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('consultationFee')
      .optional()
      .isInt({ min: 0 }).withMessage('Consultation fee must be positive'),
    body('consultationStartTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('consultationEndTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format'),
    body('slotDuration')
      .optional()
      .isInt({ min: 15, max: 60 }).withMessage('Slot duration must be between 15 and 60 minutes'),
    body('availableDays')
      .optional()
      .isArray().withMessage('Available days must be an array'),
    body('qualifications')
      .optional()
      .isArray().withMessage('Qualifications must be an array')
  ],
  validateErrors,
  updateDoctorProfile
);

// GET /api/v1/doctors/appointments
// Get doctor's appointments
router.get('/appointments', protect, getDoctorAppointments);

// GET /api/v1/doctors/appointments/:id
// Get appointment details
router.get('/appointments/:id', protect, getAppointmentDetail);

// PUT /api/v1/doctors/appointments/:id/complete
// Mark appointment as completed
router.put(
  '/appointments/:id/complete',
  protect,
  [
    body('prescription')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Prescription must not exceed 1000 characters'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Notes must not exceed 500 characters')
  ],
  validateErrors,
  completeAppointment
);

// GET /api/v1/doctors/analytics
// Get appointment analytics and statistics
router.get('/analytics', protect, getAnalytics);

module.exports = router;
