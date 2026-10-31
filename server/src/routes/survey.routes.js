import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import authorize    from '../middleware/authorize.js';
import {
  getAllSurveys,
  getSurveyById,
  createSurvey,
  updateSurvey,
  approveSurvey,
  rejectSurvey,
} from '../controllers/survey.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',              getAllSurveys);
router.get('/:id',           getSurveyById);
router.post('/',             createSurvey);
router.put('/:id',           updateSurvey);

// Only ADMIN or SALES can approve/reject surveys
router.patch('/:id/approve', authorize('ADMIN', 'SALES'), approveSurvey);
router.patch('/:id/reject',  authorize('ADMIN', 'SALES'), rejectSurvey);

export default router;
