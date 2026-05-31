const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, forgotPassword, resetPassword, getMe, updateProfile } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

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
 * Public Routes
 */

// POST /api/auth/register
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

// POST /api/auth/login
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

// POST /api/auth/forgot-password
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

// POST /api/auth/reset-password
router.post(
  '/reset-password',
  [
    body('token')
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
 * Protected Routes (Require Authentication)
 */

// GET /api/auth/me - Get current user profile
router.get('/me', protect, getMe);

// PUT /api/auth/profile - Update user profile
router.put(
  '/profile',
  protect,
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
      .matches(/^\d{10}$/).withMessage('Phone must be 10 digits')
  ],
  validateErrors,
  updateProfile
);

module.exports = router;
