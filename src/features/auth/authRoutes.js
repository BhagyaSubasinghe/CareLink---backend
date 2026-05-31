const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const {
  register,
  login,
  forgotPassword,
  verifyOtp,
  resetPassword,
  googleLogin,
  googleRegister,
  getCurrentUser,
  updateProfile
} = require('./authController');
const { verifyToken } = require('../../shared/middlewares/authMiddleware');

/**
 * Validation Middleware
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
 * POST /api/auth/register
 * Register a new user with email/password
 */
router.post(
  '/register',
  [
    body('firstName')
      .trim()
      .notEmpty().withMessage('First name is required'),
    body('lastName')
      .trim()
      .notEmpty().withMessage('Last name is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required')
      .normalizeEmail(),
    body('phone')
      .trim()
      .matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain number')
      .matches(/[!@#$%^&*]/).withMessage('Password must contain special character (!@#$%^&*)'),
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
  ],
  validateErrors,
  register
);

/**
 * POST /api/auth/login
 * Login user with email/password
 */
router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required'),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],
  validateErrors,
  login
);

/**
 * POST /api/auth/forgot-password (STEP 1)
 * Send OTP to user's email
 */
router.post(
  '/forgot-password',
  [
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required')
  ],
  validateErrors,
  forgotPassword
);

/**
 * POST /api/auth/verify-otp (STEP 2)
 * Verify OTP and get reset token
 */
router.post(
  '/verify-otp',
  [
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  validateErrors,
  verifyOtp
);

/**
 * POST /api/auth/reset-password (STEP 3)
 * Reset password using reset token from verified OTP
 */
router.post(
  '/reset-password',
  [
    body('resetToken')
      .notEmpty().withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain uppercase letter')
      .matches(/[a-z]/).withMessage('Password must contain lowercase letter')
      .matches(/[0-9]/).withMessage('Password must contain number')
      .matches(/[!@#$%^&*]/).withMessage('Password must contain special character'),
    body('confirmPassword')
      .notEmpty().withMessage('Confirm password is required')
  ],
  validateErrors,
  resetPassword
);

/**
 * POST /api/auth/google-login
 * Login/register user with Google OAuth
 */
router.post(
  '/google-login',
  [
    body('googleId')
      .trim()
      .notEmpty().withMessage('Google ID is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required'),
    body('firstName')
      .optional()
      .trim(),
    body('lastName')
      .optional()
      .trim(),
    body('avatar')
      .optional()
      .trim()
  ],
  validateErrors,
  googleLogin
);

/**
 * POST /api/auth/google-register
 * Register user with Google OAuth (alternative endpoint)
 */
router.post(
  '/google-register',
  [
    body('googleId')
      .trim()
      .notEmpty().withMessage('Google ID is required'),
    body('email')
      .trim()
      .isEmail().withMessage('Valid email is required'),
    body('firstName')
      .optional()
      .trim(),
    body('lastName')
      .optional()
      .trim(),
    body('avatar')
      .optional()
      .trim()
  ],
  validateErrors,
  googleRegister
);

/**
 * ============================================
 * PROTECTED ROUTES (Authentication Required)
 * ============================================
 */

/**
 * GET /api/users/profile
 * Get current logged-in user profile
 */
router.get('/profile', verifyToken, getCurrentUser);

/**
 * PUT /api/users/profile
 * Update current user profile
 */
router.put(
  '/profile',
  verifyToken,
  [
    body('firstName')
      .optional()
      .trim()
      .notEmpty().withMessage('First name cannot be empty'),
    body('lastName')
      .optional()
      .trim()
      .notEmpty().withMessage('Last name cannot be empty'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
    body('avatar')
      .optional()
      .trim()
  ],
  validateErrors,
  updateProfile
);

module.exports = router;

