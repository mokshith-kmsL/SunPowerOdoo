import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
} from '../controllers/product.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',    getAllProducts);
router.get('/:id', getProductById);

// Only ADMIN or WAREHOUSE can create/edit products
router.post('/',    authorize('ADMIN', 'WAREHOUSE'), createProduct);
router.put('/:id',  authorize('ADMIN', 'WAREHOUSE'), updateProduct);

export default router;
