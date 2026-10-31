import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// This middleware protects routes that require login.
// It checks the Authorization header for a valid JWT token.
// If valid, it adds the user's info to req.user so controllers can use it.
//
// The frontend sends requests like:
//   Authorization: Bearer <token>

const authenticate = async (req, res, next) => {
  try {
    // 1. Get the token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in.',
      });
    }

    // The header looks like "Bearer abc123..." — we only want the token part
    const token = authHeader.split(' ')[1];

    // 2. Verify the token using our secret key
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expired. Please log in again.'
        : 'Invalid token.';
      return res.status(401).json({ success: false, message });
    }

    // 3. Make sure the user still exists in the database
    //    (they could have been deleted or deactivated after getting the token)
    const result = await db.query(
      'SELECT id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account deactivated.' });
    }

    // 4. Attach user info to the request so any controller can access it via req.user
    req.user = {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    };

    next(); // Continue to the actual route handler

  } catch (err) {
    next(err);
  }
};

export default authenticate;
