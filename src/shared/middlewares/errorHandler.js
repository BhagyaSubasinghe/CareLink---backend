/**
 * Global Error Handling Middleware
 */
exports.errorHandler = (err, req, res, next) => {
  // Log the error
  console.error('Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Default error response
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Server Error';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const errors = Object.values(err.errors).map(e => e.message);
    message = 'Validation Error';
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `User with this ${field} already exists`;
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Invalid ID format';
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  // Generic error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};
