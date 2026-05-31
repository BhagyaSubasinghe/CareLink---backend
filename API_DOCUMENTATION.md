# CareLink Backend - Auth API Documentation

## Overview
This document describes the authentication API endpoints for the CareLink frontend application.

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
Most endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

---

## Endpoints

### 1. User Registration
**Endpoint:** `POST /auth/register`

**Public:** ✅ No authentication required

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phone": "1234567890",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "patient",
    "verified": false
  }
}
```

**Error Response (400/409):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "password",
      "message": "Password must contain uppercase letter"
    }
  ]
}
```

---

### 2. User Login
**Endpoint:** `POST /auth/login`

**Public:** ✅ No authentication required

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "patient",
    "profilePicture": null,
    "verified": false
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Current User Profile
**Endpoint:** `GET /auth/me`

**Protected:** 🔒 Requires Bearer token

**Headers:**
```
Authorization: Bearer <jwt_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "role": "patient",
    "profilePicture": null,
    "verified": false
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

---

### 4. Update User Profile
**Endpoint:** `PUT /auth/profile`

**Protected:** 🔒 Requires Bearer token

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "9876543210",
  "profilePicture": "https://example.com/image.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phone": "9876543210",
    "profilePicture": "https://example.com/image.jpg",
    "role": "patient"
  }
}
```

---

### 5. Forgot Password
**Endpoint:** `POST /auth/forgot-password`

**Public:** ✅ No authentication required

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists, password reset instructions will be sent to that email",
  "resetToken": "a1b2c3d4e5f6..." (only in development)
}
```

---

### 6. Reset Password
**Endpoint:** `POST /auth/reset-password`

**Public:** ✅ No authentication required

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid or expired password reset token"
}
```

---

## Error Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Successful GET/PUT request |
| 201 | Created | Successful resource creation |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Invalid/expired token |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate email/phone |
| 500 | Server Error | Internal server error |

---

## Frontend Integration Example

### Using Axios
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Register
const register = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error(error.response?.data);
    throw error;
  }
};

// Login
const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password
    });
    localStorage.setItem('token', response.data.token);
    return response.data;
  } catch (error) {
    console.error(error.response?.data);
    throw error;
  }
};

// Get current user
const getMe = async () => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data);
    throw error;
  }
};

// Update profile
const updateProfile = async (userData) => {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.put(`${API_BASE_URL}/auth/profile`, userData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error(error.response?.data);
    throw error;
  }
};

export { register, login, getMe, updateProfile };
```

---

## Environment Variables Required

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/carelink
JWT_SECRET=your_secret_key
FRONTEND_URL=http://localhost:3000
```

---

## Token Expiration
- JWT tokens expire after **7 days**
- Users must login again to get a new token
- Refresh token mechanism can be added in future

---

## Security Notes

1. **Never** commit `.env` file to version control
2. **Always** use HTTPS in production
3. **Store tokens** securely (localStorage, sessionStorage, or cookies)
4. **Clear tokens** on logout
5. **Validate** all inputs on frontend and backend
6. **Use strong** JWT_SECRET in production
7. **Enable CORS** only for trusted origins

---

## Testing the API

Using cURL:

```bash
# Register
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

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'

# Get current user
curl -X GET http://localhost:5000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"
```

---

## Support
For issues or questions, please refer to the main README.md or create an issue in the repository.
