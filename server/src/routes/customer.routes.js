import { Router }    from 'express';
import authenticate  from '../middleware/authenticate.js';
import authorize     from '../middleware/authorize.js';
import {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '../controllers/customer.controller.js';

const router = Router();

// All customer routes require login
router.use(authenticate);

router.get('/',     getAllCustomers);
router.get('/:id',  getCustomerById);
router.post('/',    createCustomer);
router.put('/:id',  updateCustomer);
router.delete('/:id', authorize('ADMIN'), deleteCustomer);

export default router;
