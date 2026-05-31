const crypto = require('crypto');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @body    { firstName, lastName, email, phone, password }
 * @return  { success: bool, message: string, token: string, user: object }
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // Validate password strength
    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must contain: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { phone }] 
    });
    
    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'email' : 'phone';
      return res.status(409).json({ 
        success: false,
        message: `User with this ${field} already exists` 
      });
    }

    // Create new user (password will be hashed in the model's pre-save hook)
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      role: 'patient',
      verified: false
    });

    // Generate JWT token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verified: user.verified
      }
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({ 
        success: false,
        message: `User with this ${field} already exists` 
      });
    }
    next(err);
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @body    { email, password }
 * @return  { success: bool, message: string, token: string, user: object }
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email and password are required' 
      });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Check password match using the instance method
    const isPasswordValid = await user.matchPassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid email or password' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
        verified: user.verified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Forgot password - Generate reset token
 * @route   POST /api/auth/forgot-password
 * @body    { email }
 * @return  { success: bool, message: string }
 */
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false,
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Security: don't reveal if email exists
      return res.status(200).json({ 
        success: true,
        message: 'If an account exists, password reset instructions will be sent to that email' 
      });
    }

    // Generate reset token (32 bytes = 64 hex characters)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set token and expiration (1 hour)
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = Date.now() + (60 * 60 * 1000);
    await user.save();

    // In production: send resetToken via email
    // For now, return token for testing (REMOVE IN PRODUCTION)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    console.log(`Password reset link: ${resetUrl}`);

    res.status(200).json({
      success: true,
      message: 'Password reset instructions sent to email',
      // Remove this in production - only for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reset password using token
 * @route   POST /api/auth/reset-password
 * @body    { token, password, confirmPassword }
 * @return  { success: bool, message: string, token: string }
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Token and password are required' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Passwords do not match' 
      });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({ 
        success: false,
        message: 'Password must contain: 8+ characters, uppercase, lowercase, number, and special character (!@#$%^&*)'
      });
    }

    // Hash the token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid or expired password reset token' 
      });
    }

    // Update password (will be hashed in pre-save hook)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Generate new auth token
    const authToken = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, user: object }
 */
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePicture: user.profilePicture,
        verified: user.verified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/profile
 * @header  Authorization: Bearer <token>
 * @body    { firstName, lastName, phone, profilePicture }
 * @return  { success: bool, message: string, user: object }
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, profilePicture } = req.body;
    
    const user = await User.findById(req.user.id);

    // Check if phone is being updated and if it already exists
    if (phone && phone !== user.phone) {
      const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
      if (existingPhone) {
        return res.status(409).json({ 
          success: false,
          message: 'Phone number already in use' 
        });
      }
      user.phone = phone.trim();
    }

    if (firstName) user.firstName = firstName.trim();
    if (lastName) user.lastName = lastName.trim();
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        profilePicture: user.profilePicture,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Validate password strength
 * @param   {string} password
 * @return  {boolean}
 */
function validatePasswordStrength(password) {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password)
  };

  return Object.values(requirements).every(req => req === true);
}
