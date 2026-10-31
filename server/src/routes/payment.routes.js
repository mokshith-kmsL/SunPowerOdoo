import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import { recordPayment, getAllPayments } from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',  authorize('ADMIN', 'SALES'), getAllPayments);
router.post('/', recordPayment);

export default router;
