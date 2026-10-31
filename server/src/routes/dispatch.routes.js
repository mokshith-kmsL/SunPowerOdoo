import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllDispatches,
  getDispatchById,
  createDispatch,
  markDelivered,
} from '../controllers/dispatch.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',                getAllDispatches);
router.get('/:id',             getDispatchById);
router.post('/',               authorize('ADMIN', 'WAREHOUSE'), createDispatch);
router.patch('/:id/deliver',   authorize('ADMIN', 'WAREHOUSE'), markDelivered);

export default router;
