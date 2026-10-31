import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import {
  getAllInstallations,
  getInstallationById,
  createInstallation,
  completeInstallation,
} from '../controllers/installation.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',                    getAllInstallations);
router.get('/:id',                 getInstallationById);
router.post('/',                   createInstallation);
router.patch('/:id/complete',      completeInstallation);

export default router;
