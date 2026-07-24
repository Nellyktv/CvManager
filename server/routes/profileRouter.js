import { Router } from 'express';
import CandidateProfileController from '../controllers/CandidateProfileController.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const profileRouter = Router();

profileRouter.get(
  '/',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  CandidateProfileController.getProfile,
);
profileRouter.put(
  '/',
  checkRoleMiddleware(['CANDIDATE', 'ADMIN']),
  CandidateProfileController.updateProfile,
);
