import bcrypt   from 'bcryptjs';
import jwt       from 'jsonwebtoken';
import db        from '../config/db.js';
import asyncHandler from '../utils/asyncHandler.js';
import { sendSuccess, sendCreated, sendError } from '../utils/responseHelper.js';
import AppError  from '../utils/AppError.js';

// ─────────────────────────────────────────────
// Helper: create a JWT token for a user
// The token contains the user's id, email, and role.
// The frontend stores this and sends it with every request.
// ─────────────────────────────────────────────
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// ─────────────────────────────────────────────
// POST /api/auth/login
// Body: { email, password }
// ─────────────────────────────────────────────
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  // Look up the user by email
  const result = await db.query(
    'SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );

  const user = result.rows[0];

  // We check both "user not found" and "wrong password" with the same message.
  // This is a security best practice — don't tell attackers which one failed.
  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  // bcrypt.compare checks if the plain password matches the stored hash
  const passwordIsCorrect = await bcrypt.compare(password, user.password_hash);
  if (!passwordIsCorrect) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Contact admin.', 403);
  }

  const token = createToken(user);

  // Return the token and user info (never return password_hash)
  sendSuccess(res, 'Login successful.', {
    token,
    user: {
      id:    user.id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Returns the profile of the currently logged-in user.
// Requires: authentication (token in header)
// ─────────────────────────────────────────────
export const getMe = asyncHandler(async (req, res) => {
  // req.user is set by the authenticate middleware
  const result = await db.query(
    'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
    [req.user.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  sendSuccess(res, 'Profile fetched.', result.rows[0]);
});

// ─────────────────────────────────────────────
// POST /api/auth/register
// Public registration for staff accounts.
// ADMIN role is blocked — only existing admins can create admins.
// Body: { name, email, password, role }
// ─────────────────────────────────────────────
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', 400);
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }

  // Block admin self-registration
  const allowedRoles = ['SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT'];
  const userRole = allowedRoles.includes(role) ? role : 'SALES';

  // Check if email is already in use
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Hash the password before saving
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role`,
    [name.trim(), email.toLowerCase().trim(), passwordHash, userRole]
  );

  const newUser = result.rows[0];
  const token = createToken(newUser);

  sendCreated(res, 'Registration successful.', {
    token,
    user: newUser,
  });
});

// ─────────────────────────────────────────────
// POST /api/auth/users
// Creates a new system user (staff account).
// Only ADMIN can do this.
// Body: { name, email, password, role }
// ─────────────────────────────────────────────
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const validRoles = ['ADMIN', 'SALES', 'TECHNICIAN', 'WAREHOUSE', 'SUPPORT'];
  if (!validRoles.includes(role)) {
    throw new AppError(`Role must be one of: ${validRoles.join(', ')}`, 400);
  }

  // Check if email is already in use
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  if (existing.rows.length > 0) {
    throw new AppError('A user with this email already exists.', 409);
  }

  // Hash the password before saving — never store plain text passwords
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, is_active, created_at`,
    [name.trim(), email.toLowerCase().trim(), passwordHash, role]
  );

  sendCreated(res, 'User created successfully.', result.rows[0]);
});

// ─────────────────────────────────────────────
// GET /api/auth/users
// Lists all system users. ADMIN only.
// ─────────────────────────────────────────────
export const listUsers = asyncHandler(async (req, res) => {
  const result = await db.query(
    'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC'
  );

  sendSuccess(res, 'Users fetched.', result.rows);
});

// ─────────────────────────────────────────────
// PATCH /api/auth/users/:id/toggle
// Activate or deactivate a user. ADMIN only.
// ─────────────────────────────────────────────
export const toggleUserActive = asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  // Prevent admin from locking themselves out
  if (userId === req.user.id) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  // Flip the is_active flag
  const result = await db.query(
    `UPDATE users
     SET is_active = NOT is_active
     WHERE id = $1
     RETURNING id, name, email, role, is_active`,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  const user   = result.rows[0];
  const status = user.is_active ? 'activated' : 'deactivated';

  sendSuccess(res, `User ${status}.`, user);
});

// ─────────────────────────────────────────────
// PUT /api/auth/users/:id/password
// Reset any user's password. ADMIN only.
// Body: { password }
// ─────────────────────────────────────────────
export const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;

  if (!password || password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await db.query(
    `UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, name, email`,
    [passwordHash, req.params.id]
  );

  if (result.rows.length === 0) {
    throw new AppError('User not found.', 404);
  }

  sendSuccess(res, 'Password reset successfully.');
});
