const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const {
  createBooking,
  getBookings,
  cancelBooking
} = require('./bookingController');
const { verifyToken } = require('../../shared/middlewares/authMiddleware');

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
 * BOOKING ROUTES (3 Core Endpoints)
 * ============================================
 */

/**
 * POST /api/v1/bookings
 * Create a new booking/appointment
 * @body { doctor, date, timeSlot, visitType, reason }
 */
router.post(
  '/',
  verifyToken,
  [
    body('doctor')
      .notEmpty().withMessage('Doctor ID is required')
      .isMongoId().withMessage('Invalid doctor ID'),
    body('date')
      .notEmpty().withMessage('Date is required')
      .isISO8601().withMessage('Invalid date format (use YYYY-MM-DD)'),
    body('timeSlot')
      .notEmpty().withMessage('Time slot is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)'),
    body('visitType')
      .notEmpty().withMessage('Visit type is required')
      .isIn(['in-person', 'telemedicine']).withMessage('Visit type must be in-person or telemedicine'),
    body('reason')
      .notEmpty().withMessage('Reason for visit is required')
      .trim()
      .isLength({ min: 10, max: 500 }).withMessage('Reason must be between 10 and 500 characters')
  ],
  validateErrors,
  createBooking
);

/**
 * GET /api/v1/bookings
 * Get user's appointments/bookings
 * @query { status, page, limit }
 */
router.get(
  '/',
  verifyToken,
  [
    query('status')
      .optional()
      .isIn(['Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No-Show']).withMessage('Invalid status'),
    query('page')
      .optional()
      .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  validateErrors,
  getBookings
);

/**
 * DELETE /api/v1/bookings/:id
 * Cancel a booking/appointment
 * @param { id } - Booking ID
 * @body { reason (optional) }
 */
router.delete(
  '/:id',
  verifyToken,
  [
    param('id')
      .isMongoId().withMessage('Invalid booking ID'),
    body('reason')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Reason must not exceed 500 characters')
  ],
  validateErrors,
  cancelBooking
);

module.exports = router;
