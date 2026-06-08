const express = require('express');
const router = express.Router();
const { verifyToken } = require('../../shared/middlewares/authMiddleware');
const { getQueuePosition, createBooking } = require('./bookingController');

/**
 * GET /api/appointments/queue-position
 * Fetch dynamic queue position before booking
 * @query { doctorId, date, time }
 */
router.get('/queue-position', getQueuePosition);

/**
 * POST /api/appointments/book
 * Create a new booking/appointment
 * Requires authentication
 * @body { doctor, date, timeSlot, visitType, reason }
 * Note: createBooking handler expects these fields according to existing booking logic
 */
router.post('/book', verifyToken, createBooking);

module.exports = router;
