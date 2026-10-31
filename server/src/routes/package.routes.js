import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllPackages,
  getPackageById,
  createPackage,
  updatePackage,
} from '../controllers/package.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',    getAllPackages);
router.get('/:id', getPackageById);

// Only ADMIN can create or modify packages
router.post('/',   authorize('ADMIN'), createPackage);
router.put('/:id', authorize('ADMIN'), updatePackage);

export default router;
