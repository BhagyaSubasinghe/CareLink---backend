const Doctor = require('./Doctor');
const User = require('../user/User');
const Appointment = require('../booking/Appointment');

/**
 * ============================================
 * PUBLIC API METHODS (No Authentication)
 * ============================================
 */

/**
 * METHOD 1: GET ALL DOCTORS
 * @desc    Get all doctors with filters (specialty, location, visitType)
 * @route   GET /api/doctors
 * @query   specialty, location, visitType, rating, page, limit
 * @return  { success: bool, data: array, total: number, page: number, limit: number }
 */
exports.getAllDoctors = async (req, res, next) => {
  try {
    const { specialty, location, visitType, rating, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = { isVerified: true };

    // Filter by specialty
    if (specialty) {
      filter.$or = filter.$or || [];
      filter.specialty = specialty;
    }

    // Filter by location
    if (location) {
      filter.location = new RegExp(location, 'i'); // Case-insensitive
    }

    // Filter by visit type (in-person or telemedicine)
    if (visitType) {
      filter.visitTypes = visitType;
    }

    // Filter by minimum rating
    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const doctors = await Doctor.find(filter)
      .select('firstName lastName specialty hospital location rating reviews fee avatar visitTypes consultationFee experience education')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ rating: -1, reviews: -1 });

    // Get total count
    const total = await Doctor.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: doctors,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit))
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 2: GET SINGLE DOCTOR BY ID
 * @desc    Get doctor details by ID (for booking page)
 * @route   GET /api/doctors/:id
 * @return  { success: bool, data: object }
 */
exports.getDoctorById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const doctor = await Doctor.findById(id)
      .select('firstName lastName specialty hospital location rating reviews fee avatar visitTypes consultationFee experience education bio slots availableDays consultationStartTime consultationEndTime');

    if (!doctor || !doctor.isVerified) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (err) {
    next(err);
  }
};

/**
 * ============================================
 * PROTECTED DOCTOR MANAGEMENT METHODS
 * ============================================
 */

/**
 * @desc    Register as a doctor
 * @route   POST /api/doctors/register
 * @body    { specialization, licenseNumber, experience, hospital, consultationFee, bio, qualifications, availableDays, consultationStartTime, consultationEndTime, slotDuration }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string, doctor: object }
 */
exports.registerDoctor = async (req, res, next) => {
  try {
    const {
      specialization,
      licenseNumber,
      experience,
      hospital,
      location,
      consultationFee,
      bio,
      qualifications,
      education,
      availableDays,
      consultationStartTime,
      consultationEndTime,
      slotDuration,
      visitTypes,
      slots
    } = req.body;

    // Get user details
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already registered as doctor
    const existingDoctor = await Doctor.findOne({ user: req.user.id });
    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'You are already registered as a doctor'
      });
    }

    // Check if license number already exists
    const existingLicense = await Doctor.findOne({ licenseNumber });
    if (existingLicense) {
      return res.status(409).json({
        success: false,
        message: 'License number already registered'
      });
    }

    // Create doctor profile
    const doctor = await Doctor.create({
      user: req.user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      specialty: specialization,
      specialization,
      licenseNumber,
      experience,
      hospital,
      location: location || 'Not specified',
      consultationFee,
      fee: consultationFee,
      bio: bio || '',
      qualifications: qualifications || [],
      education: education || [],
      availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      consultationStartTime,
      consultationEndTime,
      slotDuration: slotDuration || 30,
      visitTypes: visitTypes || ['in-person', 'telemedicine'],
      slots: slots || []
    });

    // Update user role
    await User.findByIdAndUpdate(req.user.id, { role: 'doctor' });

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully. Pending admin verification.',
      data: doctor
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'License number already registered'
      });
    }
    next(err);
  }
};

/**
 * @desc    Get doctor's profile
 * @route   GET /api/doctors/profile
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, data: object }
 */
exports.getDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found. Please register as a doctor first.'
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
 * @desc    Update doctor profile
 * @route   PUT /api/v1/doctors/profile
 * @body    { bio, qualifications, consultationFee, availableDays, consultationStartTime, consultationEndTime, slotDuration }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string, doctor: object }
 */
exports.updateDoctorProfile = async (req, res, next) => {
  try {
    const {
      bio,
      qualifications,
      consultationFee,
      availableDays,
      consultationStartTime,
      consultationEndTime,
      slotDuration
    } = req.body;

    let doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Update fields
    if (bio !== undefined) doctor.bio = bio;
    if (qualifications !== undefined) doctor.qualifications = qualifications;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (availableDays !== undefined) doctor.availableDays = availableDays;
    if (consultationStartTime !== undefined) doctor.consultationStartTime = consultationStartTime;
    if (consultationEndTime !== undefined) doctor.consultationEndTime = consultationEndTime;
    if (slotDuration !== undefined) doctor.slotDuration = slotDuration;

    doctor = await doctor.save();
    await doctor.populate('user', 'firstName lastName email phone');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      doctor
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get doctor's appointments
 * @route   GET /api/v1/doctors/appointments
 * @query   status, date, page, limit
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, appointments: array }
 */
exports.getDoctorAppointments = async (req, res, next) => {
  try {
    const { status, date, page = 1, limit = 10 } = req.query;

    // Find doctor
    const doctor = await Doctor.findOne({ user: req.user.id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Build filter
    const filter = { doctor: doctor._id };

    if (status) {
      filter.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      filter.appointmentDate = { $gte: startDate, $lte: endDate };
    }

    const skip = (page - 1) * limit;

    const appointments = await Appointment.find(filter)
      .populate('patient', 'firstName lastName email phone')
      .sort({ appointmentDate: -1, startTime: -1 })
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
 * @desc    Get single appointment details
 * @route   GET /api/v1/doctors/appointments/:id
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, appointment: object }
 */
exports.getAppointmentDetail = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'firstName lastName email phone')
      .populate('doctor');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the doctor
    if (appointment.doctor.user.toString() !== req.user.id) {
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
 * @desc    Mark appointment as completed
 * @route   PUT /api/v1/doctors/appointments/:id/complete
 * @body    { prescription, notes }
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, message: string }
 */
exports.completeAppointment = async (req, res, next) => {
  try {
    const { prescription, notes } = req.body;

    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check if user is the doctor
    if (appointment.doctor.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this appointment'
      });
    }

    // Check if appointment can be completed
    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already marked as completed'
      });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete a cancelled appointment'
      });
    }

    // Update appointment
    appointment.status = 'Completed';
    if (prescription) appointment.prescription = prescription;
    if (notes) appointment.notes = notes;

    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment marked as completed'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get appointment analytics
 * @route   GET /api/v1/doctors/analytics
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, analytics: object }
 */
exports.getAnalytics = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ user: req.user.id });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Get appointment statistics
    const totalAppointments = await Appointment.countDocuments({ doctor: doctor._id });
    const completedAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      status: 'Completed'
    });
    const cancelledAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      status: 'Cancelled'
    });
    const noShowAppointments = await Appointment.countDocuments({
      doctor: doctor._id,
      status: 'No-Show'
    });

    // Get revenue
    const paidAppointments = await Appointment.find({
      doctor: doctor._id,
      status: 'Completed',
      paymentStatus: 'Paid'
    });

    const totalRevenue = paidAppointments.reduce((sum, apt) => sum + apt.consultationFee, 0);

    // Get upcoming appointments
    const now = new Date();
    const upcomingAppointments = await Appointment.find({
      doctor: doctor._id,
      appointmentDate: { $gte: now },
      status: 'Scheduled'
    }).limit(5);

    res.status(200).json({
      success: true,
      analytics: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        cancellationRate: ((cancelledAppointments / totalAppointments) * 100).toFixed(2) + '%',
        totalRevenue,
        averageConsultationFee: doctor.consultationFee,
        rating: doctor.rating,
        reviewCount: doctor.reviewCount,
        upcomingAppointments
      }
    });
  } catch (err) {
    next(err);
  }
};
