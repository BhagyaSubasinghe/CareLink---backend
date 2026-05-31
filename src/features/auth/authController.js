const crypto = require('crypto');
const User = require('../user/User');
const generateToken = require('../../shared/utils/generateToken');
const { generateOTP, getExpiryDate, isValidEmail } = require('../../shared/utils/validators');

/**
 * Validate password strength
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

/**
 * METHOD 1: REGISTER
 * @desc    Register a new user with email/password
 * @route   POST /api/auth/register
 * @body    { firstName, lastName, email, phone, password, confirmPassword }
 * @return  { success: bool, message: string, token: string, user: object }
 */
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
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

    // Create new user
    const user = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      password,
      isVerified: true, // Email/password users are verified on registration
      role: 'patient'
    });

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
        isVerified: user.isVerified
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
 * METHOD 2: LOGIN
 * @desc    Login user with email/password
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

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password match
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
        avatar: user.avatar || user.profilePicture,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 3: FORGOT PASSWORD (STEP 1 - Send OTP)
 * @desc    Generate and send OTP to user's email
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

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Security: don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: 'If an account exists, a password reset code will be sent to your email'
      });
    }

    // Generate 6-digit OTP
    const otp = generateOTP(6);

    // Store OTP (hashed) and expiration (10 minutes)
    user.resetOtp = crypto.createHash('sha256').update(otp).digest('hex');
    user.resetOtpExpires = getExpiryDate(10);
    await user.save({ validateBeforeSave: false });

    // In production: send OTP via email
    // For now, log it for testing
    console.log(`OTP for ${email}: ${otp}`);

    res.status(200).json({
      success: true,
      message: 'OTP sent to your email',
      // Only return OTP in development
      ...(process.env.NODE_ENV === 'development' && { otp })
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 4: VERIFY OTP (STEP 2 - Verify 6-digit code)
 * @desc    Verify OTP sent to user's email
 * @route   POST /api/auth/verify-otp
 * @body    { email, otp }
 * @return  { success: bool, message: string, resetToken: string }
 */
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find user with OTP
    const user = await User.findOne({
      email: email.toLowerCase()
    }).select('+resetOtp +resetOtpExpires');

    if (!user || !user.resetOtp) {
      return res.status(400).json({
        success: false,
        message: 'No OTP request found. Please request a new one'
      });
    }

    // Check if OTP has expired
    if (Date.now() > user.resetOtpExpires) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one'
      });
    }

    // Hash the provided OTP and compare
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    if (otpHash !== user.resetOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // OTP is valid - generate a temporary reset token (valid for 15 minutes)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = getExpiryDate(15);
    user.resetOtp = undefined; // Clear OTP after verification
    user.resetOtpExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      resetToken // Client uses this for the final password reset
    });
  } catch (err) {
    next(err);
  }
};

/**
 * METHOD 5: RESET PASSWORD (STEP 3 - Set new password)
 * @desc    Reset password using reset token (from verified OTP)
 * @route   POST /api/auth/reset-password
 * @body    { resetToken, password, confirmPassword }
 * @return  { success: bool, message: string, token: string }
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { resetToken, password, confirmPassword } = req.body;

    if (!resetToken || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Reset token, password, and confirmation are required'
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
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
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
 * METHOD 6: GOOGLE LOGIN
 * @desc    Login/register user with Google OAuth
 * @route   POST /api/auth/google-login
 * @body    { googleId, email, firstName, lastName, avatar }
 * @return  { success: bool, message: string, token: string, user: object, isNewUser: bool }
 */
exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, email, firstName, lastName, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google ID and email are required'
      });
    }

    // Check if user exists
    let user = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (user) {
      // Existing user - update Google ID if missing
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user._id);

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        isNewUser: false,
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified
        }
      });
    }

    // New user - create account
    // Google users are auto-verified
    user = await User.create({
      googleId,
      email: email.toLowerCase(),
      firstName: firstName || 'User',
      lastName: lastName || '',
      avatar,
      isVerified: true,
      verified: true,
      role: 'patient',
      // Generate a random password for Google users (not used for login)
      password: crypto.randomBytes(16).toString('hex')
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created and logged in successfully',
      token,
      isNewUser: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified
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
 * METHOD 7: GOOGLE REGISTER
 * @desc    Register user with Google OAuth (alias for googleLogin)
 * @route   POST /api/auth/google-register
 * @body    { googleId, email, firstName, lastName, avatar }
 * @return  { success: bool, message: string, token: string, user: object, isNewUser: bool }
 */
exports.googleRegister = async (req, res, next) => {
  try {
    const { googleId, email, firstName, lastName, avatar } = req.body;

    if (!googleId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Google ID and email are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ googleId }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists. Please login instead'
      });
    }

    // Create new user
    const user = await User.create({
      googleId,
      email: email.toLowerCase(),
      firstName: firstName || 'User',
      lastName: lastName || '',
      avatar,
      isVerified: true,
      verified: true,
      role: 'patient',
      password: crypto.randomBytes(16).toString('hex')
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      isNewUser: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified
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
 * METHOD 8: GET CURRENT USER (from JWT)
 * @desc    Get current logged-in user profile
 * @route   GET /api/users/profile
 * @header  Authorization: Bearer <token>
 * @return  { success: bool, user: object }
 */
exports.getCurrentUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || user.profilePicture,
        role: user.role,
        isVerified: user.isVerified,
        googleId: user.googleId ? true : false,
        lastLogin: user.lastLogin
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE PROFILE (bonus method for completeness)
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @header  Authorization: Bearer <token>
 * @body    { firstName, lastName, phone, avatar }
 * @return  { success: bool, message: string, user: object }
 */
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone, avatar } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

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
    if (avatar) user.avatar = avatar;

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
        avatar: user.avatar,
        role: user.role
      }
    });
  } catch (err) {
    next(err);
  }
};
