class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.message = message;
    this.details = details;
    this.isOperational = true; // To differentiate from programming errors

    // Capture the stack trace (for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
