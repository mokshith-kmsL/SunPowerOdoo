import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import { getAllTechnicians } from '../controllers/technician.controller.js';

const router = Router();

router.use(authenticate);
router.get('/', getAllTechnicians);

export default router;
