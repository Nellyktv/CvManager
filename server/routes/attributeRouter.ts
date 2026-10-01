import { Router } from 'express';
import AttributeController from '../controllers/AttributeController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const attributeRouter = Router();


attributeRouter.get('/', authMiddleware, AttributeController.getAllAttributes);
attributeRouter.get('/:id', authMiddleware, AttributeController.getAttribute);


attributeRouter.post('/', checkRoleMiddleware(['RECRUITER', 'ADMIN']), AttributeController.createAttribute);
attributeRouter.put('/:id', checkRoleMiddleware(['RECRUITER', 'ADMIN']), AttributeController.updateAttribute);
attributeRouter.delete('/:id', checkRoleMiddleware(['RECRUITER', 'ADMIN']), AttributeController.deleteAttribute);
