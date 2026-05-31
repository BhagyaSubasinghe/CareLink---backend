# CareLink - Quick Start Guide

## Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

---

## Backend Setup

### 1. Install Dependencies
```bash
cd CareLink-backend
npm install
```

### 2. Configure Environment
Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/carelink
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

### 3. Start Backend Server
```bash
npm run dev
```

Server will run on `http://localhost:5000`

---

## Frontend Setup

### 1. Install Dependencies
```bash
cd CareLink-frontend
npm install
```

### 2. Configure Environment
Create `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### 3. Start Frontend Application
```bash
npm start
```

Frontend will open at `http://localhost:3000`

---

## Testing the Auth Flow

### 1. Register a New Account
- Navigate to `http://localhost:3000/register`
- Fill in the form with valid data:
  - First Name: John
  - Last Name: Doe
  - Email: john@example.com
  - Phone: 1234567890
  - Password: SecurePass123! (must meet all requirements)
  - Confirm Password: SecurePass123!
- Click "Create Account"

### 2. Login
- Navigate to `http://localhost:3000/login`
- Enter credentials:
  - Email: john@example.com
  - Password: SecurePass123!
- Click "Login"

### 3. View Dashboard
- You should be redirected to dashboard
- User profile information will be displayed

---

## API Testing with cURL

### Register User
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Current User (replace TOKEN)
```bash
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Project Structure

```
CareLink-backend/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/       # Business logic
│   │   └── authController.js
│   ├── middlewares/       # Express middleware
│   │   ├── authMiddleware.js
│   │   └── errorHandler.js
│   ├── models/           # Database models
│   │   └── User.js
│   ├── routes/           # API routes
│   │   └── authRoutes.js
│   └── utils/            # Utility functions
│       └── generateToken.js
├── server.js             # Main server file
├── .env.example          # Environment template
├── package.json
└── README.md

CareLink-frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ...
│   ├── components/
│   │   ├── Navbar.jsx
│   │   └── ...
│   ├── services/
│   │   ├── api.js        # Axios configuration
│   │   ├── authService.js # Auth API calls
│   │   └── ...
│   ├── App.js
│   └── index.js
├── .env
├── package.json
└── README.md
```

---

## Common Issues & Solutions

### Issue: Cannot connect to MongoDB
**Solution:**
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env is correct
- For Atlas: `mongodb+srv://username:password@cluster.mongodb.net/carelink`

### Issue: CORS error when frontend tries to call API
**Solution:**
- Check backend is running on port 5000
- Verify FRONTEND_URL in .env matches frontend URL
- Clear browser cache and reload

### Issue: "Invalid token" after login
**Solution:**
- Clear localStorage: `localStorage.clear()` in console
- Ensure JWT_SECRET matches between frontend and backend
- Re-login to get a new token

### Issue: Password validation fails
**Solution:**
- Password must have:
  - Minimum 8 characters
  - At least 1 uppercase letter (A-Z)
  - At least 1 lowercase letter (a-z)
  - At least 1 number (0-9)
  - At least 1 special character (!@#$%^&*)
- Example: `SecurePass123!`

### Issue: "User with this email already exists"
**Solution:**
- Use a different email address
- Or delete the user from MongoDB and re-register

---

## API Documentation

Complete API documentation is available in:
- `API_DOCUMENTATION.md` - Full endpoint documentation
- `FRONTEND_INTEGRATION.md` - Frontend integration examples

---

## Environment Variables Reference

| Variable | Backend | Frontend | Description |
|----------|---------|----------|-------------|
| PORT | ✅ | ❌ | Server port (default: 5000) |
| MONGO_URI | ✅ | ❌ | MongoDB connection string |
| JWT_SECRET | ✅ | ❌ | JWT secret key |
| FRONTEND_URL | ✅ | ❌ | Frontend URL for CORS |
| NODE_ENV | ✅ | ❌ | Environment (development/production) |
| REACT_APP_API_URL | ❌ | ✅ | Backend API URL |

---

## Next Steps

1. ✅ Backend auth setup
2. ✅ Frontend integration
3. ⏳ Implement password reset emails
4. ⏳ Email verification
5. ⏳ OAuth (Google, Facebook)
6. ⏳ User profile features
7. ⏳ Doctor registration
8. ⏳ Appointment system

---

## Support

For issues or questions:
1. Check the documentation files
2. Review API response messages
3. Check browser console for errors
4. Check server logs for backend errors

---

## Useful Commands

```bash
# Backend
npm run dev          # Start with nodemon
npm start            # Start production

# Frontend
npm start            # Start development server
npm run build        # Build for production
npm test             # Run tests

# MongoDB
mongod              # Start MongoDB
mongo               # Connect to MongoDB CLI

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

Last Updated: May 28, 2026
