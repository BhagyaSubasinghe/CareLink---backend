# Doctor Booking System - API Documentation

## Overview
Complete doctor appointment booking system for CareLink. Includes doctor search, availability checking, appointment booking, cancellation, and reviews.

## Base URL
```
http://localhost:5000/api/v1/booking
```

---

## Models

### Doctor Model
```javascript
{
  user: ObjectId,                    // Reference to User model
  specialization: String,            // Cardiology, Neurology, etc.
  licenseNumber: String,             // Unique license
  experience: Number,                // Years of experience
  hospital: String,                  // Hospital/clinic name
  consultationFee: Number,           // Fee in currency
  bio: String,                       // Professional biography
  qualifications: [String],          // List of qualifications
  availableDays: [String],           // Monday, Tuesday, etc.
  consultationStartTime: String,     // HH:MM format
  consultationEndTime: String,       // HH:MM format
  slotDuration: Number,              // Minutes (15-60)
  isVerified: Boolean,               // Admin verification
  rating: Number,                    // Average rating (0-5)
  reviewCount: Number,               // Number of reviews
  profilePicture: String,            // URL
  isAvailable: Boolean               // Active status
}
```

### Appointment Model
```javascript
{
  patient: ObjectId,                 // Reference to User (patient)
  doctor: ObjectId,                  // Reference to Doctor
  appointmentDate: Date,             // YYYY-MM-DD
  startTime: String,                 // HH:MM format
  endTime: String,                   // HH:MM format
  symptoms: String,                  // Description of symptoms
  consultationType: String,          // In-Person, Online, Phone
  status: String,                    // Scheduled, Completed, Cancelled, etc.
  consultationFee: Number,           // Fee at time of booking
  paymentStatus: String,             // Pending, Paid, Refunded
  paymentId: String,                 // Payment gateway transaction ID
  prescription: String,              // Doctor's prescription
  notes: String,                     // Additional notes
  rating: Number,                    // Patient rating (0-5)
  review: String,                    // Patient review
  reminderSent: Boolean,             // Email reminder status
  joinUrl: String,                   // For online consultations
  cancellationReason: String,        // Why appointment was cancelled
  rescheduledFrom: ObjectId          // Original appointment if rescheduled
}
```

---

## Endpoints

### 1. Get All Doctors
**GET** `/doctors`

**Public:** ✅ No authentication required

**Query Parameters:**
- `specialization` - Filter by specialization
- `hospital` - Filter by hospital name
- `search` - Search by doctor name
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/booking/doctors?specialization=Cardiology&page=1&limit=10"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Doctors retrieved successfully",
  "doctors": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "specialization": "Cardiology",
      "hospital": "Apollo Hospital",
      "consultationFee": 500,
      "experience": 10,
      "rating": 4.5,
      "reviewCount": 25,
      "user": {
        "_id": "507f1f77bcf86cd799439010",
        "firstName": "Rajesh",
        "lastName": "Kumar",
        "email": "rajesh@hospital.com",
        "profilePicture": "url"
      },
      "qualifications": ["MD", "DM Cardiology"],
      "availableDays": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "consultationStartTime": "09:00",
      "consultationEndTime": "17:00",
      "slotDuration": 30
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5
  }
}
```

---

### 2. Get Doctor Profile
**GET** `/doctors/:id`

**Public:** ✅ No authentication required

**Example Request:**
```bash
curl -X GET http://localhost:5000/api/v1/booking/doctors/507f1f77bcf86cd799439011
```

**Success Response (200):**
```json
{
  "success": true,
  "doctor": {
    "_id": "507f1f77bcf86cd799439011",
    "specialization": "Cardiology",
    "hospital": "Apollo Hospital",
    "experience": 10,
    "consultationFee": 500,
    "bio": "Highly experienced cardiologist with 10 years of experience...",
    "qualifications": ["MD", "DM Cardiology", "FACC"],
    "rating": 4.8,
    "reviewCount": 50,
    "licenseNumber": "MED12345",
    "isVerified": true,
    "user": {
      "_id": "507f1f77bcf86cd799439010",
      "firstName": "Rajesh",
      "lastName": "Kumar",
      "email": "rajesh@hospital.com",
      "phone": "9876543210",
      "profilePicture": "url"
    }
  }
}
```

---

### 3. Get Available Slots
**GET** `/available-slots/:doctorId/:date`

**Public:** ✅ No authentication required

**Parameters:**
- `doctorId` - Doctor's ID
- `date` - Date in YYYY-MM-DD format

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/booking/available-slots/507f1f77bcf86cd799439011/2026-06-15"
```

**Success Response (200):**
```json
{
  "success": true,
  "date": "2026-06-15",
  "doctor": {
    "_id": "507f1f77bcf86cd799439010",
    "firstName": "Rajesh",
    "lastName": "Kumar"
  },
  "totalSlots": 8,
  "slots": [
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "14:00",
    "14:30"
  ]
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Doctor is not available on Sundays"
}
```

---

### 4. Book Appointment
**POST** `/appointments`

**Protected:** 🔒 Requires Bearer token

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Request Body:**
```json
{
  "doctorId": "507f1f77bcf86cd799439011",
  "appointmentDate": "2026-06-15",
  "startTime": "10:00",
  "symptoms": "I am experiencing chest pain and shortness of breath for the past 2 days",
  "consultationType": "In-Person"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:5000/api/v1/booking/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "doctorId": "507f1f77bcf86cd799439011",
    "appointmentDate": "2026-06-15",
    "startTime": "10:00",
    "symptoms": "Chest pain and shortness of breath",
    "consultationType": "In-Person"
  }'
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Appointment booked successfully",
  "appointment": {
    "_id": "507f1f77bcf86cd799439020",
    "patient": {
      "_id": "507f1f77bcf86cd799439001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "doctor": {
      "_id": "507f1f77bcf86cd799439011",
      "specialization": "Cardiology",
      "hospital": "Apollo Hospital"
    },
    "appointmentDate": "2026-06-15",
    "startTime": "10:00",
    "endTime": "10:30",
    "symptoms": "Chest pain and shortness of breath",
    "consultationType": "In-Person",
    "status": "Scheduled",
    "consultationFee": 500,
    "paymentStatus": "Pending",
    "createdAt": "2026-05-28T10:30:00.000Z"
  }
}
```

---

### 5. Get My Appointments
**GET** `/my-appointments`

**Protected:** 🔒 Requires Bearer token

**Query Parameters:**
- `status` - Filter by status (Scheduled, Completed, Cancelled)
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/booking/my-appointments?status=Scheduled" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "appointments": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "patient": {
        "_id": "507f1f77bcf86cd799439001",
        "firstName": "John",
        "lastName": "Doe"
      },
      "doctor": {
        "specialization": "Cardiology",
        "hospital": "Apollo Hospital",
        "user": {
          "firstName": "Rajesh",
          "lastName": "Kumar"
        }
      },
      "appointmentDate": "2026-06-15",
      "startTime": "10:00",
      "status": "Scheduled",
      "consultationType": "In-Person"
    }
  ],
  "pagination": {
    "total": 5,
    "page": 1,
    "pages": 1
  }
}
```

---

### 6. Get Appointment Details
**GET** `/appointments/:id`

**Protected:** 🔒 Requires Bearer token

**Example Request:**
```bash
curl -X GET "http://localhost:5000/api/v1/booking/appointments/507f1f77bcf86cd799439020" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "appointment": {
    "_id": "507f1f77bcf86cd799439020",
    "patient": {
      "_id": "507f1f77bcf86cd799439001",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "phone": "1234567890"
    },
    "doctor": {
      "_id": "507f1f77bcf86cd799439011",
      "specialization": "Cardiology",
      "consultationFee": 500,
      "rating": 4.8
    },
    "appointmentDate": "2026-06-15",
    "startTime": "10:00",
    "endTime": "10:30",
    "symptoms": "Chest pain",
    "consultationType": "In-Person",
    "status": "Scheduled",
    "paymentStatus": "Pending",
    "prescription": null,
    "notes": null
  }
}
```

---

### 7. Cancel Appointment
**PUT** `/appointments/:id/cancel`

**Protected:** 🔒 Requires Bearer token

**Constraints:**
- Must be cancelled at least 24 hours before appointment
- Cannot cancel already completed appointments

**Request Body:**
```json
{
  "cancellationReason": "Schedule conflict"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/booking/appointments/507f1f77bcf86cd799439020/cancel \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "cancellationReason": "Schedule conflict"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Appointment cancelled successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Appointments can only be cancelled at least 24 hours before the scheduled time"
}
```

---

### 8. Add Review & Rating
**PUT** `/appointments/:id/review`

**Protected:** 🔒 Requires Bearer token

**Constraints:**
- Can only review completed appointments
- Rating must be between 1 and 5

**Request Body:**
```json
{
  "rating": 5,
  "review": "Dr. Rajesh was very professional and attentive. Great experience!"
}
```

**Example Request:**
```bash
curl -X PUT http://localhost:5000/api/v1/booking/appointments/507f1f77bcf86cd799439020/review \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "rating": 5,
    "review": "Excellent consultation. Very helpful doctor!"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Review added successfully"
}
```

---

## Error Responses

| Code | Message | Cause |
|------|---------|-------|
| 400 | Missing required fields | Incomplete request data |
| 400 | Invalid date format | Wrong date format |
| 400 | This time slot is already booked | Slot is taken |
| 400 | Can only review completed appointments | Wrong appointment status |
| 403 | Not authorized | Wrong user trying to access |
| 404 | Doctor not found | Invalid doctor ID |
| 404 | Appointment not found | Invalid appointment ID |
| 409 | Appointment already exists | Double booking |

---

## Specializations Available

- Cardiology
- Neurology
- Orthopedics
- Dermatology
- Pediatrics
- Psychiatry
- General Medicine
- ENT
- Gynecology
- Ophthalmology
- Dentistry
- Urology

---

## Consultation Types

- **In-Person** - Physical visit at hospital/clinic
- **Online** - Video consultation
- **Phone** - Telephone consultation

---

## Appointment Status

- **Scheduled** - Appointment confirmed
- **Completed** - Appointment completed by doctor
- **Cancelled** - Appointment cancelled by patient
- **Rescheduled** - Appointment rescheduled to new date
- **No-Show** - Patient didn't show up

---

## Frontend Integration Example

```javascript
// Get all cardiologists
const getDoctors = async () => {
  const response = await fetch('/api/v1/booking/doctors?specialization=Cardiology');
  const data = await response.json();
  return data.doctors;
};

// Get available slots
const getSlots = async (doctorId, date) => {
  const response = await fetch(`/api/v1/booking/available-slots/${doctorId}/${date}`);
  const data = await response.json();
  return data.slots;
};

// Book appointment
const bookAppointment = async (token, bookingData) => {
  const response = await fetch('/api/v1/booking/appointments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  });
  return response.json();
};

// Get my appointments
const getMyAppointments = async (token) => {
  const response = await fetch('/api/v1/booking/my-appointments', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};

// Cancel appointment
const cancelAppointment = async (token, appointmentId, reason) => {
  const response = await fetch(`/api/v1/booking/appointments/${appointmentId}/cancel`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ cancellationReason: reason })
  });
  return response.json();
};

// Add review
const addReview = async (token, appointmentId, rating, review) => {
  const response = await fetch(`/api/v1/booking/appointments/${appointmentId}/review`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ rating, review })
  });
  return response.json();
};
```

---

## Database Seeding (Sample Data)

To add sample doctors, use:

```bash
curl -X POST http://localhost:5000/api/v1/admin/doctors/seed \
  -H "Content-Type: application/json"
```

This would require a separate admin endpoint (not included in basic booking system).

---

## Notes

- All dates are in UTC
- Times are in 24-hour HH:MM format
- Appointment slots are automatically calculated based on doctor's working hours and slot duration
- Doctor ratings are automatically updated after each review
- Cancellations require 24-hour notice to avoid penalty
- All time-sensitive operations validate against current time
