import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import { getAllLeads, getLeadById, createLead, updateLead } from '../controllers/lead.controller.js';

const router = Router();

router.use(authenticate); // All lead routes require login

router.get('/',     getAllLeads);
router.get('/:id',  getLeadById);
router.post('/',    createLead);
router.put('/:id',  updateLead);

export default router;
