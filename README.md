# CareLink Backend

Express.js backend for the [CareLink Frontend](https://github.com/BhagyaSubasinghe/CareLink-frontend), a complete healthcare management system with user authentication and doctor appointment booking.

## Features

### Authentication System
- User registration and login
- Email verification
- Password reset with secure tokens
- JWT-based session management
- Role-based access control (patient, doctor, admin)

### Doctor Booking System
- Browse available doctors with search and filtering
- Check doctor availability and time slots
- Book appointments with specific doctors
- Cancel appointments (24-hour notice)
- Leave reviews and ratings
- Doctor dashboard with appointment management
- Doctor analytics and statistics

### Security
- Password hashing with bcryptjs
- JWT token authentication
- Input validation with express-validator
- CORS protection
- Comprehensive error handling

---

## Tech Stack

- **Runtime:** Node.js v20+
- **Framework:** Express.js 4.22.1
- **Database:** MongoDB with Mongoose 7.3.1
- **Authentication:** JWT (jsonwebtoken 9.0.0)
- **Security:** bcryptjs 2.4.3, crypto
- **Validation:** express-validator 7.0.1
- **CORS:** cors 2.8.5

---

## Project Structure

```
CareLink-backend/
├── src/
│   ├── models/
│   │   ├── User.js           # User authentication model
│   │   ├── Doctor.js         # Doctor profile model
│   │   └── Appointment.js    # Appointment bookings model
│   ├── controllers/
│   │   ├── authController.js       # Auth logic
│   │   ├── bookingController.js    # Booking logic
│   │   └── doctorController.js     # Doctor logic
│   ├── routes/
│   │   ├── authRoutes.js       # /api/v1/auth
│   │   ├── bookingRoutes.js    # /api/v1/booking
│   │   └── doctorRoutes.js     # /api/v1/doctors
│   ├── middlewares/
│   │   ├── authMiddleware.js   # JWT verification
│   │   └── errorHandler.js     # Error handling
│   ├── utils/
│   │   └── generateToken.js    # Token generation
│   └── config/
│       └── database.js         # DB configuration
├── server.js                   # Entry point
├── .env.example                # Environment template
├── API_DOCUMENTATION.md        # Auth API docs
├── DOCTOR_BOOKING_API.md       # Booking API docs
├── BOOKING_SYSTEM_GUIDE.md     # Complete implementation guide
├── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js v20 or higher
- MongoDB local or Atlas
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/BhagyaSubasinghe/CareLink---backend.git
   cd CareLink-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env:**
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb://localhost:27017/carelink
   JWT_SECRET=your-super-secret-key-change-this-in-production
   FRONTEND_URL=http://localhost:3000
   API_PREFIX=/api/v1
   API_VERSION=v1
   ```

5. **Start the server:**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

6. **Verify it's running:**
   ```bash
   curl http://localhost:5000/
   # Should return: {"success": true, "message": "CareLink Backend API is running", ...}
   ```

---

## API Documentation

### Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | ❌ | User registration |
| POST | `/login` | ❌ | User login |
| POST | `/forgot-password` | ❌ | Request password reset |
| POST | `/reset-password` | ❌ | Reset password with token |
| GET | `/me` | ✅ | Get current user profile |
| PUT | `/profile` | ✅ | Update profile |

### Booking Endpoints (`/api/v1/booking`)

**Public:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doctors` | List all doctors with filters |
| GET | `/doctors/:id` | Get doctor profile |
| GET | `/available-slots/:doctorId/:date` | Get available time slots |

**Protected (Requires Bearer Token):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/appointments` | Book appointment |
| GET | `/my-appointments` | Get user's appointments |
| GET | `/appointments/:id` | Get appointment details |
| PUT | `/appointments/:id/cancel` | Cancel appointment |
| PUT | `/appointments/:id/review` | Add review and rating |

### Doctor Endpoints (`/api/v1/doctors`)

**Protected (Requires Bearer Token):**
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register as doctor |
| GET | `/profile` | Get doctor profile |
| PUT | `/profile` | Update doctor profile |
| GET | `/appointments` | List doctor's appointments |
| GET | `/appointments/:id` | Get appointment details |
| PUT | `/appointments/:id/complete` | Complete appointment |
| GET | `/analytics` | View dashboard stats |

---

## Quick Start Examples

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}'
```

### Browse Doctors
```bash
curl http://localhost:5000/api/v1/booking/doctors?specialization=Cardiology
```

### Book Appointment
```bash
curl -X POST http://localhost:5000/api/v1/booking/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "doctorId": "DOCTOR_ID",
    "appointmentDate": "2026-06-15",
    "startTime": "10:00",
    "symptoms": "Chest pain",
    "consultationType": "In-Person"
  }'
```

---

## Documentation Files

- **API_DOCUMENTATION.md** - Complete authentication API reference
- **DOCTOR_BOOKING_API.md** - Booking system API reference
- **BOOKING_SYSTEM_GUIDE.md** - Implementation guide with data flows
- **FRONTEND_INTEGRATION.md** - React integration examples

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| PORT | ❌ | 5000 | Server port |
| NODE_ENV | ❌ | development | Environment |
| MONGO_URI | ✅ | - | MongoDB connection string |
| JWT_SECRET | ✅ | - | JWT signing secret |
| FRONTEND_URL | ❌ | http://localhost:3000 | Frontend URL for CORS |
| API_PREFIX | ❌ | /api/v1 | API base path |

---

## License

MIT License
