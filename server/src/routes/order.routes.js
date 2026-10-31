import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import { getAllOrders, getOrderById, updateOrderStatus } from '../controllers/order.controller.js';
import { getPaymentsForOrder } from '../controllers/payment.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',                                        getAllOrders);
router.get('/:id',                                     getOrderById);
router.patch('/:id/status', authorize('ADMIN', 'SALES', 'WAREHOUSE'), updateOrderStatus);

// Nested route: GET /api/orders/:id/payments
router.get('/:id/payments',                            getPaymentsForOrder);

export default router;
