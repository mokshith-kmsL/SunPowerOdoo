import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import { getAllSerialNumbers, addSerialNumbers } from '../controllers/serial.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',  getAllSerialNumbers);
router.post('/', authorize('ADMIN', 'WAREHOUSE'), addSerialNumbers);

export default router;
