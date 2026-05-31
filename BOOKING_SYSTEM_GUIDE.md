# Doctor Booking System - Complete Implementation Guide

## System Overview

The doctor booking system allows patients to:
1. Search and filter available doctors
2. View doctor profiles and availability
3. Book appointments with specific time slots
4. View and manage their appointments
5. Cancel appointments (with 24-hour notice)
6. Leave reviews and ratings

Doctors can:
1. Register their professional profile
2. Manage their availability and consultation fees
3. View their upcoming appointments
4. Complete appointments and add prescriptions
5. View analytics and patient reviews

---

## Models Created

### 1. Doctor.js
Stores doctor profile information linked to a User account.

**Key Fields:**
- `specialization` - Medical specialty (12 options)
- `licenseNumber` - Unique medical license
- `experience` - Years of clinical experience
- `hospital` - Associated hospital/clinic
- `consultationFee` - Fee per appointment
- `availableDays` - Working days (e.g., Monday-Friday)
- `consultationStartTime/EndTime` - Office hours (HH:MM format)
- `slotDuration` - Appointment duration (15-60 minutes)
- `rating` - Average patient rating (0-5)
- `isVerified` - Admin verification status

### 2. Appointment.js
Records all appointment bookings between patients and doctors.

**Key Fields:**
- `patient` - Reference to User (patient)
- `doctor` - Reference to Doctor profile
- `appointmentDate` - Scheduled date
- `startTime/endTime` - Time slot
- `status` - Scheduled, Completed, Cancelled, Rescheduled, No-Show
- `symptoms` - Patient's health concern
- `consultationType` - In-Person, Online, or Phone
- `rating` - Patient's rating (after completion)
- `review` - Patient's written review
- `prescription` - Doctor's prescription notes
- `paymentStatus` - Pending, Paid, Refunded

---

## API Endpoints

### Booking Routes (`/api/v1/booking`)

#### Public Endpoints

**1. Get All Doctors**
```
GET /doctors?specialization=Cardiology&page=1&limit=10
```
Response includes doctor profiles with ratings and availability info.

**2. Get Doctor Profile**
```
GET /doctors/:id
```
Detailed view of a specific doctor's information.

**3. Get Available Slots**
```
GET /available-slots/:doctorId/:date
```
Returns available time slots for a specific date.

#### Protected Endpoints (Requires Bearer Token)

**4. Book Appointment**
```
POST /appointments
Authorization: Bearer <token>
Body: {
  doctorId, appointmentDate, startTime, symptoms, consultationType
}
```

**5. Get My Appointments**
```
GET /my-appointments?status=Scheduled&page=1
Authorization: Bearer <token>
```

**6. Get Appointment Details**
```
GET /appointments/:id
Authorization: Bearer <token>
```

**7. Cancel Appointment**
```
PUT /appointments/:id/cancel
Authorization: Bearer <token>
Body: { cancellationReason }
```
Note: Can only cancel 24+ hours before appointment.

**8. Add Review**
```
PUT /appointments/:id/review
Authorization: Bearer <token>
Body: { rating, review }
```

### Doctor Routes (`/api/v1/doctors`)

#### Protected Endpoints (Doctors Only)

**1. Register as Doctor**
```
POST /register
Authorization: Bearer <token>
Body: {
  specialization, licenseNumber, experience, hospital,
  consultationFee, consultationStartTime, consultationEndTime,
  bio, qualifications, availableDays, slotDuration
}
```

**2. Get Doctor Profile**
```
GET /profile
Authorization: Bearer <token>
```

**3. Update Doctor Profile**
```
PUT /profile
Authorization: Bearer <token>
Body: { bio, qualifications, consultationFee, etc. }
```

**4. Get Doctor's Appointments**
```
GET /appointments?status=Scheduled&date=2026-06-15
Authorization: Bearer <token>
```

**5. Get Appointment Details**
```
GET /appointments/:id
Authorization: Bearer <token>
```

**6. Complete Appointment**
```
PUT /appointments/:id/complete
Authorization: Bearer <token>
Body: { prescription, notes }
```

**7. Get Analytics**
```
GET /analytics
Authorization: Bearer <token>
```
Returns dashboard stats: total/completed/cancelled appointments, revenue, ratings.

---

## Controllers

### bookingController.js
**Functions:**
- `getAllDoctors()` - Search and filter doctors
- `getDoctorProfile()` - View single doctor
- `getAvailableSlots()` - Calculate free time slots
- `bookAppointment()` - Create new appointment
- `getMyAppointments()` - Fetch user's appointments
- `getAppointmentDetails()` - View single appointment
- `cancelAppointment()` - Cancel with 24-hour rule
- `addReview()` - Submit rating and review

**Helper Functions:**
- `generateTimeSlots()` - Calculate slots based on hours and duration
- `addMinutesToTime()` - Time arithmetic

### doctorController.js
**Functions:**
- `registerDoctor()` - Register doctor profile
- `getDoctorProfile()` - Get logged-in doctor's profile
- `updateDoctorProfile()` - Edit availability, fees, bio
- `getDoctorAppointments()` - List doctor's bookings
- `getAppointmentDetail()` - View patient details
- `completeAppointment()` - Mark done, add prescription
- `getAnalytics()` - Dashboard statistics

---

## Data Flow

### Booking an Appointment

```
User Login
    ↓
Search Doctors (GET /doctors?specialization=X)
    ↓
View Doctor Profile (GET /doctors/:id)
    ↓
Check Available Slots (GET /available-slots/:doctorId/:date)
    ↓
Book Appointment (POST /appointments)
    ↓
Appointment Created with Status: "Scheduled"
    ↓
Confirmation Email Sent (future enhancement)
```

### Completing an Appointment

```
Doctor Views Appointment (GET /doctors/appointments/:id)
    ↓
Appointment Time Arrives (Status: "Scheduled")
    ↓
Doctor Completes Visit (PUT /doctors/appointments/:id/complete)
    ↓
Status Changed to "Completed"
    ↓
Patient Can Now Review (PUT /booking/appointments/:id/review)
    ↓
Doctor Rating Updated
```

---

## Validation Rules

### Appointment Booking
- Doctor must exist and be available
- Date must be in future
- Time slot must be free (no overlapping bookings)
- Symptoms description: 10-500 characters
- Consultation type must be valid

### Doctor Registration
- Specialization must be one of 12 valid types
- License number must be unique
- Experience must be positive number
- Hospital name: 3-100 characters
- Consultation times in HH:MM format
- Slot duration: 15-60 minutes
- Bio: max 500 characters

### Reviews
- Rating must be 1-5 stars
- Only completed appointments can be reviewed
- Review text: max 500 characters

### Cancellation
- Can only cancel "Scheduled" appointments
- Must be 24+ hours before appointment
- Cannot cancel completed appointments

---

## Availability Logic

**Slot Generation:**
1. Get doctor's working hours (e.g., 09:00-17:00)
2. Get slot duration (e.g., 30 minutes)
3. Generate slots: 09:00, 09:30, 10:00, ..., 16:30
4. Remove booked slots from available list
5. Return remaining slots

**Conflict Detection:**
- Check if time slot exists in appointments
- Status != 'Cancelled' (cancelled slots are considered free)
- Return 409 Conflict if slot is taken

---

## Environment Variables Needed

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/carelink
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
API_PREFIX=/api/v1
API_VERSION=v1
```

---

## Error Handling

All errors follow consistent format:
```json
{
  "success": false,
  "message": "Error description",
  "field": "fieldName" (optional, for validation)
}
```

**Common Errors:**
- 400: Invalid input, missing fields, validation failed
- 404: Doctor/appointment/patient not found
- 403: Not authorized (wrong user)
- 409: Conflict (slot already booked, doctor registered twice)
- 500: Server error

---

## Database Indexes

**Appointment Indexes:**
- `patient + appointmentDate` - Fast user appointment lookup
- `doctor + appointmentDate` - Fast doctor appointment lookup
- `status` - Quick status filtering
- `appointmentDate` - Date range queries

**Doctor Indexes:**
- `specialization` - Filter by specialty
- `hospital` - Filter by location
- `rating` - Sort by ratings

---

## Testing Checklist

### As Patient
- [ ] View list of all doctors
- [ ] Filter doctors by specialization
- [ ] View doctor profile
- [ ] Check available slots for a date
- [ ] Book appointment
- [ ] View my appointments
- [ ] Cancel appointment (if >24 hours away)
- [ ] Leave review after completion

### As Doctor
- [ ] Register doctor profile
- [ ] Update availability and fees
- [ ] View my appointments
- [ ] View appointment details
- [ ] Complete appointment
- [ ] Add prescription
- [ ] View my analytics

---

## Frontend Integration Notes

The frontend should:
1. Use JWT token from auth login
2. Pass token in Authorization header: `Bearer <token>`
3. Handle 401 (token expired) by refreshing
4. Show available slots in calendar format
5. Validate form inputs before sending
6. Display error messages to users
7. Show loading states during API calls
8. Update doctor ratings in real-time
9. Implement 24-hour cancellation countdown

---

## Future Enhancements

1. **Email Notifications**
   - Booking confirmation
   - 24-hour appointment reminder
   - Cancellation notification

2. **Payment Integration**
   - Stripe/Razorpay payment processing
   - Track payment status
   - Refund handling

3. **Video Consultation**
   - Generate Jitsi/Zoom meeting URL
   - Video call recording
   - Chat during consultation

4. **Admin Dashboard**
   - Verify doctor credentials
   - Suspend/remove doctors
   - View platform statistics
   - Resolve disputes

5. **SMS Reminders**
   - Send SMS 24 hours before appointment
   - Cancellation alerts via SMS

6. **Rescheduling**
   - Allow changing appointment date/time
   - Track original vs rescheduled appointments

7. **Prescription Management**
   - Create digital prescriptions
   - Send to pharmacy
   - Track medicine availability

8. **Insurance Integration**
   - Validate insurance coverage
   - Auto-deduct from insurance

---

## Code Quality Notes

- All controllers validate inputs before database operations
- Error handling middleware catches all exceptions
- Mongoose schemas use validation and indexes
- Routes use express-validator for request validation
- Authorization checks ensure data privacy
- Consistent response format across all endpoints
- Helper functions extracted for reusability (slot generation, time calculation)

---

## File Structure

```
src/
├── models/
│   ├── User.js
│   ├── Doctor.js          (NEW)
│   └── Appointment.js     (NEW)
├── controllers/
│   ├── authController.js
│   ├── bookingController.js   (NEW)
│   └── doctorController.js    (NEW)
├── routes/
│   ├── authRoutes.js
│   ├── bookingRoutes.js   (NEW)
│   └── doctorRoutes.js    (NEW)
├── middlewares/
│   ├── authMiddleware.js
│   └── errorHandler.js
├── utils/
│   └── generateToken.js
└── config/
    └── database.js
```

---

## API Rate Limiting (Recommended)

Add to server.js for production:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Deployment Checklist

- [ ] Set MONGO_URI to production database
- [ ] Change JWT_SECRET to strong random value
- [ ] Set NODE_ENV=production
- [ ] Enable HTTPS only
- [ ] Set FRONTEND_URL to production domain
- [ ] Configure CORS for production URLs
- [ ] Add rate limiting
- [ ] Enable request logging
- [ ] Set up email service for notifications
- [ ] Configure payment gateway
- [ ] Add monitoring and error tracking
- [ ] Backup database regularly
- [ ] Use environment variables for all secrets
