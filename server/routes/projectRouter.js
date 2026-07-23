import { Router } from 'express';
import ProjectController from '../controllers/ProjectController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';

export const projectRouter = Router();

projectRouter.get('/', authMiddleware, ProjectController.getMyProjects);
projectRouter.post('/', authMiddleware, ProjectController.createProject);
projectRouter.put('/:id', authMiddleware, ProjectController.updateProject);
projectRouter.delete('/:id', authMiddleware, ProjectController.deleteProject);
