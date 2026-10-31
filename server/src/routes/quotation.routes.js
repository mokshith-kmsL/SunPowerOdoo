import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  approveQuotation,
  rejectQuotation,
  convertToOrder,
} from '../controllers/quotation.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',                           getAllQuotations);
router.get('/:id',                        getQuotationById);
router.post('/',                          createQuotation);
router.patch('/:id/approve', authorize('ADMIN', 'SALES'), approveQuotation);
router.patch('/:id/reject',  authorize('ADMIN', 'SALES'), rejectQuotation);
router.post('/:id/convert-to-order',      convertToOrder);

export default router;
