const Appointment = require('./Appointment');
const Doctor = require('../doctor/Doctor');
const User = require('../user/User');

/**
 * ============================================
 * BOOKING API - 3 CORE ENDPOINTS
 * ============================================
 */

/**
 * METHOD 1: CREATE BOOKING (POST)
 * @desc    Book an appointment with a doctor
 * @route   POST /api/v1/bookings
 * @body    { doctor, date, timeSlot, visitType, reason }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string, data: object }
 */
exports.createBooking = async (req, res, next) => {
  try {
    const { doctor, date, timeSlot, visitType, reason } = req.body;
    const patientId = req.user.id;

    // Verify doctor exists and is verified
    const doctorProfile = await Doctor.findById(doctor);
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    if (!doctorProfile.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Doctor is not verified yet'
      });
    }

    // Check if doctor is available on this date
    const appointmentDate = new Date(date);
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][appointmentDate.getDay()];
    
    if (!doctorProfile.availableDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}`
      });
    }

    // Check for slot conflicts
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctor: doctor,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      startTime: timeSlot,
      status: { $in: ['Scheduled', 'Completed'] }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Calculate end time
    const [hours, minutes] = timeSlot.split(':');
    const endDate = new Date(appointmentDate);
    endDate.setHours(
      parseInt(hours) + Math.floor((parseInt(minutes) + doctorProfile.slotDuration) / 60),
      (parseInt(minutes) + doctorProfile.slotDuration) % 60
    );
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    // Create appointment
    const appointment = new Appointment({
      patient: patientId,
      doctor: doctor,
      appointmentDate: appointmentDate,
      startTime: timeSlot,
      endTime: endTime,
      symptoms: reason,
      consultationType: visitType === 'in-person' ? 'In-Person' : visitType === 'telemedicine' ? 'Online' : 'Phone',
      consultationFee: doctorProfile.consultationFee,
      status: 'Scheduled',
      paymentStatus: 'Pending'
    });

    await appointment.save();

    // Populate details
    await appointment.populate('doctor', 'firstName lastName specialty consultationFee hospital');
    await appointment.populate('patient', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: appointment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 2: GET BOOKINGS (GET)
 * @desc    Get all appointments for logged-in user
 * @route   GET /api/v1/bookings
 * @query   status, page, limit
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, data: array, pagination: object }
 */
exports.getBookings = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    // Build filter
    const filter = { patient: patientId };
    if (status) {
      filter.status = status;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get appointments
    const appointments = await Appointment.find(filter)
      .populate('doctor', 'firstName lastName specialty avatar consultationFee hospital')
      .sort({ appointmentDate: -1, startTime: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Appointment.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: appointments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 3: CANCEL BOOKING (DELETE)
 * @desc    Cancel an appointment
 * @route   DELETE /api/v1/bookings/:id
 * @body    { reason (optional) }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string }
 */
exports.cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const patientId = req.user.id;
    const { reason } = req.body;

    // Find appointment
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patient.toString() !== patientId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    // Check if appointment is too close (can't cancel within 24 hours)
    const now = new Date();
    const appointmentTime = new Date(appointment.appointmentDate);
    appointmentTime.setHours(0, 0, 0, 0);
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);

    if (hoursUntilAppointment < 24) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel appointment within 24 hours of scheduled time'
      });
    }

    // Update appointment
    appointment.status = 'Cancelled';
    appointment.cancellationReason = reason || 'Patient cancelled';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * LEGACY METHODS (Kept for reference, not used in main API)
 */

/**
 * @desc    Get all doctors with filters
 * @route   GET /api/v1/booking/doctors
 * @query   specialization, hospital, page, limit
 * @return  { success: bool, doctors: array, total: number }
 */
exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialization, hospital, page = 1, limit = 10, search } = req.query;
    
    // Build filter object
    const filter = { isAvailable: true };
    
    if (specialization) {
      filter.specialization = specialization;
    }
    
    if (hospital) {
      filter.hospital = new RegExp(hospital, 'i');
    }
    
    if (search) {
      // Search by doctor name or hospital
      const users = await User.find({
        $or: [
          { firstName: new RegExp(search, 'i') },
          { lastName: new RegExp(search, 'i') }
        ]
      }).select('_id');
      
      filter.user = { $in: users.map(u => u._id) };
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get doctors
    const doctors = await Doctor.find(filter)
      .populate('user', 'firstName lastName email phone profilePicture')
      .sort({ rating: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Doctor.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      message: 'Doctors retrieved successfully',
      doctors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get doctor profile with details
 * @route   GET /api/v1/booking/doctors/:id
 * @return  { success: bool, doctor: object }
 */
exports.getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('user', 'firstName lastName email phone profilePicture');
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      doctor
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get available time slots for a doctor on a specific date
 * @route   GET /api/v1/booking/available-slots/:doctorId/:date
 * @param   date - YYYY-MM-DD format
 * @return  { success: bool, slots: array }
 */
exports.getAvailableSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.params;
    
    // Validate date
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Check if day is available
    const dayName = appointmentDate.toLocaleDateString('en-US', { weekday: 'long' });
    if (!doctor.availableDays.includes(dayName)) {
      return res.status(400).json({
        success: false,
        message: `Doctor is not available on ${dayName}s`
      });
    }
    
    // Generate available slots
    const slots = generateTimeSlots(
      doctor.consultationStartTime,
      doctor.consultationEndTime,
      doctor.slotDuration
    );
    
    // Get booked appointments for this doctor on this date
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      status: { $ne: 'Cancelled' }
    });
    
    // Filter out booked slots
    const bookedSlots = bookedAppointments.map(apt => apt.startTime);
    const availableSlots = slots.filter(slot => !bookedSlots.includes(slot));
    
    res.status(200).json({
      success: true,
      date,
      doctor: doctor.user,
      totalSlots: availableSlots.length,
      slots: availableSlots
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Book an appointment
 * @route   POST /api/v1/booking/appointments
 * @body    { doctorId, appointmentDate, startTime, symptoms, consultationType }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string, appointment: object }
 */
exports.bookAppointment = async (req, res, next) => {
  try {
    const { doctorId, appointmentDate, startTime, symptoms, consultationType } = req.body;
    
    // Validate required fields
    if (!doctorId || !appointmentDate || !startTime || !symptoms) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    // Check if doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }
    
    // Calculate end time
    const endTime = addMinutesToTime(startTime, doctor.slotDuration);
    
    // Check if slot is available
    const dayStart = new Date(appointmentDate);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(appointmentDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const existingAppointment = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate: { $gte: dayStart, $lte: dayEnd },
      startTime,
      status: { $ne: 'Cancelled' }
    });
    
    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }
    
    // Create appointment
    const appointment = await Appointment.create({
      patient: req.user.id,
      doctor: doctorId,
      appointmentDate: new Date(appointmentDate),
      startTime,
      endTime,
      symptoms,
      consultationType: consultationType || 'In-Person',
      consultationFee: doctor.consultationFee
    });
    
    // Populate doctor details
    await appointment.populate('doctor');
    await appointment.populate('patient', 'firstName lastName email phone');
    
    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get user's appointments
 * @route   GET /api/v1/booking/my-appointments
 * @query   status, page, limit
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, appointments: array }
 */
exports.getMyAppointments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = { patient: req.user.id };
    
    if (status) {
      filter.status = status;
    }
    
    const skip = (page - 1) * limit;
    
    const appointments = await Appointment.find(filter)
      .populate('doctor')
      .populate('patient', 'firstName lastName email phone')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Appointment.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      appointments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get appointment details
 * @route   GET /api/v1/booking/appointments/:id
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, appointment: object }
 */
exports.getAppointmentDetails = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor')
      .populate('patient', 'firstName lastName email phone');
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is patient or doctor
    if (
      appointment.patient._id.toString() !== req.user.id &&
      appointment.doctor.user.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }
    
    res.status(200).json({
      success: true,
      appointment
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel appointment
 * @route   PUT /api/v1/booking/appointments/:id/cancel
 * @body    { cancellationReason }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string }
 */
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is patient
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }
    
    // Check if appointment can be cancelled
    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed appointment'
      });
    }
    
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }
    
    // Check if cancellation is at least 24 hours before appointment
    const appointmentTime = new Date(`${appointment.appointmentDate.toDateString()} ${appointment.startTime}`);
    const now = new Date();
    const hoursUntilAppointment = (appointmentTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilAppointment < 24) {
      return res.status(400).json({
        success: false,
        message: 'Appointments can only be cancelled at least 24 hours before the scheduled time'
      });
    }
    
    // Cancel appointment
    appointment.status = 'Cancelled';
    appointment.cancellationReason = cancellationReason || null;
    await appointment.save();
    
    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Rate and review appointment
 * @route   PUT /api/v1/booking/appointments/:id/review
 * @body    { rating, review }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string }
 */
exports.addReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if user is patient
    if (appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this appointment'
      });
    }
    
    // Check if appointment is completed
    if (appointment.status !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only review completed appointments'
      });
    }
    
    // Add review
    appointment.rating = rating;
    appointment.review = review || null;
    await appointment.save();
    
    // Update doctor rating
    const doctor = await Doctor.findById(appointment.doctor);
    const reviews = await Appointment.find({
      doctor: appointment.doctor,
      rating: { $exists: true, $ne: null },
      status: 'Completed'
    });
    
    const avgRating = reviews.reduce((sum, apt) => sum + apt.rating, 0) / reviews.length;
    doctor.rating = parseFloat(avgRating.toFixed(1));
    doctor.reviewCount = reviews.length;
    await doctor.save();
    
    res.status(200).json({
      success: true,
      message: 'Review added successfully'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Helper function to generate time slots
 */
function generateTimeSlots(startTime, endTime, duration) {
  const slots = [];
  
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
    const timeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
    slots.push(timeStr);
    
    currentMin += duration;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  
  return slots;
}

/**
 * Helper function to add minutes to time
 */
function addMinutesToTime(time, minutes) {
  const [hour, min] = time.split(':').map(Number);
  let newMin = min + minutes;
  let newHour = hour;
  
  if (newMin >= 60) {
    newHour += Math.floor(newMin / 60);
    newMin = newMin % 60;
  }
  
  return `${String(newHour).padStart(2, '0')}:${String(newMin).padStart(2, '0')}`;
}
