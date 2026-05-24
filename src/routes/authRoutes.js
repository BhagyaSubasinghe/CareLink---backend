const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');

// POST /api/auth/register
router.post(
  '/register',
  [
    body('firstName').trim().notEmpty().withMessage('First name is required'),
    body('lastName').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    return register(req, res, next);
  }
);

// POST /api/auth/login
router.post('/login', [body('email').isEmail(), body('password').notEmpty()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return login(req, res, next);
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail()], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return forgotPassword(req, res, next);
});

// POST /api/auth/reset-password
router.post('/reset-password', [body('token').notEmpty(), body('password').isLength({ min: 8 })], (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  return resetPassword(req, res, next);
});

module.exports = router;
