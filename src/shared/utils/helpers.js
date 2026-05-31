// Success response
exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// Error response
exports.errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && error && { error: error.message }),
  });
};

// Pagination helper
exports.getPaginationOptions = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit, page };
};
