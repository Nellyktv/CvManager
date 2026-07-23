import { Router } from 'express';
import CandidateSkillsController from '../controllers/CandidateSkillsController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';

export const skillsRouter = Router();


skillsRouter.get('/', authMiddleware, CandidateSkillsController.getMySkills);
skillsRouter.post('/', authMiddleware, CandidateSkillsController.saveSkill);
skillsRouter.delete('/:attributeId', authMiddleware, CandidateSkillsController.deleteSkill);
