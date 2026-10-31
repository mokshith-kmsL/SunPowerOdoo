// This middleware checks whether the logged-in user has the required role.
// It must be used AFTER the authenticate middleware.
//
// Usage in a route:
//   router.post('/users', authenticate, authorize('ADMIN'), createUser);
//   router.get('/reports', authenticate, authorize('ADMIN', 'SALES'), getReports);

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the authenticate middleware
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. This action requires one of these roles: ${allowedRoles.join(', ')}.`,
      });
    }

    next(); // User has the right role, continue
  };
};

export default authorize;
