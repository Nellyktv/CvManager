import { Router } from 'express';
import CvController from '../controllers/CvController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const cvRouter = Router();


cvRouter.post('/create_resume', checkRoleMiddleware(['CANDIDATE', 'ADMIN']), CvController.createCv);


cvRouter.get('/', authMiddleware, CvController.getAllCv);


cvRouter.get('/position/:positionId', checkRoleMiddleware(['RECRUITER', 'ADMIN']), CvController.getCvsByPosition);

cvRouter.get('/:id', authMiddleware, CvController.getCv);

cvRouter.put('/:id/refresh-from-profile', authMiddleware, CvController.refreshCvFromProfile);
cvRouter.put('/:id/publish', authMiddleware, CvController.publishCv);
cvRouter.put('/:id', authMiddleware, CvController.updateCv);

cvRouter.delete('/:id', authMiddleware, CvController.deleteCv);
