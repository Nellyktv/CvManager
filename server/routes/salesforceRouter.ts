import { integrationLimiter } from '../middleware/rateLimits.js';
import { Router } from 'express';
import salesforceController from '../integrations/salesforce/salesforceController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';

export const salesforceRouter = Router();

salesforceRouter.post('/sync-user', authMiddleware, integrationLimiter(), salesforceController.syncUserToSalesforce);
