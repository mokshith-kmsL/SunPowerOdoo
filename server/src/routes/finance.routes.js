import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import { getFinanceOverview } from '../controllers/finance.controller.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'SALES')); // Finance is ADMIN/SALES only

router.get('/overview', getFinanceOverview);

export default router;
