const ApiError = require('../utils/ApiError')

const errorHandler = (err, req, res, next) => {
  // If it's an operational error (such as validation error, user error, etc.)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      details: err.details || null,
    });
  }

  // If it's a programming or unexpected error
  console.error('Unexpected error:', err);
  return res.status(200).json({
    status: false,
    message: 'Something went wrong!',
  });
};

module.exports = errorHandler;   