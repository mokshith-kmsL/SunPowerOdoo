import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import { getDashboard } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate);
router.get('/dashboard', getDashboard);

export default router;
