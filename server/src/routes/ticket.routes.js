import { Router }   from 'express';
import authenticate from '../middleware/authenticate.js';
import { getAllTickets, createTicket, closeTicket } from '../controllers/ticket.controller.js';

const router = Router();

router.use(authenticate);

router.get('/',              getAllTickets);
router.post('/',             createTicket);
router.patch('/:id/close',   closeTicket);

export default router;
