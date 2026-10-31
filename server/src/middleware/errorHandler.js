// Global error handler — Express calls this when any route calls next(error)
// or when an async handler throws an error.
// It must be registered LAST in app.js (after all routes).

const errorHandler = (err, req, res, next) => {
  // Always log the error for debugging
  console.error('Error:', err.message);

  // Handle our custom AppError (thrown intentionally with a status code)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // PostgreSQL: duplicate value (e.g. duplicate email, duplicate serial number)
  if (err.code === '23505') {
    return res.status(409).json({
      success: false,
      message: 'A record with this value already exists.',
    });
  }

  // PostgreSQL: foreign key violation (e.g. referencing a customer that doesn't exist)
  if (err.code === '23503') {
    return res.status(400).json({
      success: false,
      message: 'Referenced record not found. Check the IDs you sent.',
    });
  }

  // PostgreSQL: check constraint violation (e.g. negative price)
  if (err.code === '23514') {
    return res.status(400).json({
      success: false,
      message: 'Invalid value. A database check constraint was violated.',
    });
  }

  // Multer: file too large
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File is too large. Maximum size is 5MB.',
    });
  }

  // Default: unexpected server error
  res.status(500).json({
    success: false,
    message: err.message || 'Something went wrong on the server.',
  });
};

export default errorHandler;
