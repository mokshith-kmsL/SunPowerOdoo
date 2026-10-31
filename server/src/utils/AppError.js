// AppError is a custom error class we throw when something goes wrong
// in business logic (e.g. "survey not approved", "payment reference duplicate").
//
// By adding a statusCode property, our global error handler can send
// the right HTTP status code automatically.
//
// Usage:
//   throw new AppError('Survey is not approved.', 400);
//   throw new AppError('Customer not found.', 404);

class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default AppError;
