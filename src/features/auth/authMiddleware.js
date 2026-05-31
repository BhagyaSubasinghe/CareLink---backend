const jwt = require('jsonwebtoken');
const User = require('../user/User');

/**
 * @desc    Middleware to protect routes - verify JWT token
 * @param   {object} req, {object} res, {function} next
 * @return  {object} decoded JWT or error response
 */
const verifyToken = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret-change-me');

    // Check if user exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Attach user to request object
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

/**
 * @desc    Middleware to authorize specific roles
 * @param   {...string} roles - Allowed roles
 * @return  {function} Middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    // In a real app, fetch user from DB and check role
    // For now, we assume role is in the token
    const userRole = req.user.role || 'patient';

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Not authorized for this action. Required role: ${roles.join(', ')}`
      });
    }

    next();
  };
};

// Export both named and as exports
module.exports = {
  verifyToken,
  authorize,
  protect: verifyToken // Alias for backward compatibility
};

