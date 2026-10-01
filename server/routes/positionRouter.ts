import { Router } from 'express';
import PositionController from '../controllers/PositionController.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';
import optionalAuthMiddleware from '../middleware/optionalAuthMiddleware.js';

export const positionRouter = Router();

positionRouter.get('/', optionalAuthMiddleware, PositionController.getAllPositions);
positionRouter.get('/dashboard', PositionController.getDashboardStats);
positionRouter.get('/:id', PositionController.getPosition);


positionRouter.post('/', checkRoleMiddleware(['RECRUITER', 'ADMIN']), PositionController.createPosition);
positionRouter.post('/create_position', checkRoleMiddleware(['RECRUITER', 'ADMIN']), PositionController.createPosition);
positionRouter.put('/:id', checkRoleMiddleware(['RECRUITER', 'ADMIN']), PositionController.updatePosition);
positionRouter.delete('/:id', checkRoleMiddleware(['RECRUITER', 'ADMIN']), PositionController.deletePosition);
