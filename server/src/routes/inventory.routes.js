import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllInventory,
  getLowStock,
  getInventoryByProduct,
  updateInventory,
  addStock,
} from '../controllers/inventory.controller.js';

const router = Router();

router.use(authenticate);

// IMPORTANT: '/low-stock' must come BEFORE '/:product_id' otherwise
// Express would try to match "low-stock" as a product_id.
router.get('/low-stock',                                  getLowStock);
router.get('/',                                           getAllInventory);
router.get('/:product_id',                                getInventoryByProduct);
router.put('/:product_id',    authorize('ADMIN', 'WAREHOUSE'), updateInventory);
router.post('/:product_id/add-stock', authorize('ADMIN', 'WAREHOUSE'), addStock);

export default router;
