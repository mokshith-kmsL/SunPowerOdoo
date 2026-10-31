import { Router } from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  login,
  register,
  getMe,
  createUser,
  listUsers,
  toggleUserActive,
  resetPassword,
} from '../controllers/auth.controller.js';

const router = Router();

// Public routes (no login required)
router.post('/login',    login);
router.post('/register', register);

// Protected routes (must be logged in)
router.get('/me', authenticate, getMe);

// Admin-only routes
router.post('/users',                     authenticate, authorize('ADMIN'), createUser);
router.get('/users',                      authenticate, authorize('ADMIN'), listUsers);
router.patch('/users/:id/toggle',         authenticate, authorize('ADMIN'), toggleUserActive);
router.put('/users/:id/password',         authenticate, authorize('ADMIN'), resetPassword);

export default router;
