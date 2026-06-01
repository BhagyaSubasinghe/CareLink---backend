const express = require('express');
const router = express.Router();
const { body, query, validationResult, param } = require('express-validator');
const {
  getAllDoctors,
  getDoctorById,
  registerDoctor,
  getDoctorProfile,
  updateDoctorProfile,
  getDoctorAppointments,
  getAppointmentDetail,
  completeAppointment,
  getAnalytics
} = require('./doctorController');
const { verifyToken, authorize } = require('../../shared/middlewares/authMiddleware');

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
 * ============================================
 * PUBLIC ROUTES (No Authentication Required)
 * ============================================
 */

/**
 * GET /api/doctors
 * Get all verified doctors with optional filters
 * Query: specialty, location, visitType, rating, page, limit
 */
router.get(
  '/',
  [
    query('specialty')
      .optional()
      .trim()
      .notEmpty().withMessage('Specialty cannot be empty'),
    query('location')
      .optional()
      .trim()
      .notEmpty().withMessage('Location cannot be empty'),
    query('visitType')
      .optional()
      .isIn(['in-person', 'telemedicine']).withMessage('Invalid visit type'),
    query('rating')
      .optional()
      .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validateErrors,
  getAllDoctors
);

/**
 * GET /api/doctors/:id
 * Get single doctor details by ID
 */
router.get(
  '/:id',
  [
    param('id')
      .isMongoId().withMessage('Invalid doctor ID')
  ],
  validateErrors,
  getDoctorById
);

/**
 * ============================================
 * PROTECTED ROUTES (Authentication Required)
 * ============================================
 */

/**
 * POST /api/doctors/register
 * Register as a doctor
 */
router.post(
  '/register',
  verifyToken,
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
    body('location')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Location must be between 2 and 100 characters'),
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
    body('visitTypes')
      .optional()
      .isArray().withMessage('Visit types must be an array')
      .custom((value) => {
        if (Array.isArray(value)) {
          return value.every(type => ['in-person', 'telemedicine'].includes(type));
        }
        return false;
      }).withMessage('Visit types must include in-person and/or telemedicine'),
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('qualifications')
      .optional()
      .isArray().withMessage('Qualifications must be an array'),
    body('education')
      .optional()
      .isArray().withMessage('Education must be an array')
  ],
  validateErrors,
  registerDoctor
);

/**
 * GET /api/doctors/profile
 * Get logged-in doctor's profile
 */
router.get('/profile', verifyToken, getDoctorProfile);

/**
 * PUT /api/doctors/profile
 * Update doctor's profile
 */
router.put(
  '/profile',
  verifyToken,
  [
    body('bio')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Bio must not exceed 500 characters'),
    body('consultationFee')
      .optional()
      .isInt({ min: 0 }).withMessage('Consultation fee must be positive'),
    body('availableDays')
      .optional()
      .isArray().withMessage('Available days must be an array'),
    body('consultationStartTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('consultationEndTime')
      .optional()
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('slotDuration')
      .optional()
      .isInt({ min: 15, max: 60 }).withMessage('Slot duration must be between 15 and 60 minutes'),
    body('visitTypes')
      .optional()
      .isArray().withMessage('Visit types must be an array'),
    body('slots')
      .optional()
      .isArray().withMessage('Slots must be an array')
  ],
  validateErrors,
  updateDoctorProfile
);

/**
 * GET /api/doctors/appointments
 * Get doctor's appointments
 */
router.get('/appointments', verifyToken, getDoctorAppointments);

/**
 * GET /api/doctors/appointments/:appointmentId
 * Get specific appointment details
 */
router.get('/appointments/:appointmentId', verifyToken, getAppointmentDetail);

/**
 * PUT /api/doctors/appointments/:appointmentId/complete
 * Mark appointment as completed
 */
router.put('/appointments/:appointmentId/complete', verifyToken, completeAppointment);

/**
 * GET /api/doctors/analytics
 * Get doctor's analytics (appointments, ratings, etc.)
 */
router.get('/analytics', verifyToken, getAnalytics);

module.exports = router;
