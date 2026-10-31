import { validationResult } from 'express-validator';

// This middleware runs after express-validator validation chains.
// If there are any validation errors, it sends a 422 response
// with a list of what was wrong. Otherwise it lets the request continue.
//
// Usage:
//   router.post('/', [
//     body('email').isEmail(),
//     body('name').notEmpty(),
//     validate,          // <-- this checks if the above passed
//     createCustomer,    // <-- only runs if validation passed
//   ]);

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Map errors to a clean format: [{ field: 'email', message: 'Invalid email' }]
    const errorList = errors.array().map((e) => ({
      field:   e.path,
      message: e.msg,
    }));

    return res.status(422).json({
      success: false,
      message: 'Validation failed. Please check the fields below.',
      errors:  errorList,
    });
  }

  next();
};

export default validate;
