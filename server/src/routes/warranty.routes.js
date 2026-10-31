import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import { getAllWarranties, getWarrantyBySerial } from '../controllers/warranty.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',                    getAllWarranties);
router.get('/serial/:serialNumber', getWarrantyBySerial);

export default router;
