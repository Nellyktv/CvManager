import { Router } from 'express';
import EducationController from '../controllers/EducationController.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const educationRouter = Router();

educationRouter.get(
  '/',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  EducationController.getEducations,
);
educationRouter.post(
  '/',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  EducationController.createEducation,
);
educationRouter.put(
  '/:id',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  EducationController.updateEducation,
);
educationRouter.delete(
  '/:id',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  EducationController.deleteEducation,
);
