import { Router } from 'express';
import powerAutomateController from '../integrations/powerAutomate/powerAutomateController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';

export const supportTicketRouter = Router();

supportTicketRouter.post('/', authMiddleware, powerAutomateController.createSupportTicket);
