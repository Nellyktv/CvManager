import { authenticationLimiter } from '../middleware/rateLimits.js';
import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const userRouter = Router();

userRouter.get('/google-config', UserController.googleConfig);
userRouter.post('/google', authenticationLimiter, UserController.googleAuth);
userRouter.get('/auth', authMiddleware, UserController.checkAuth);
userRouter.get('/candidates', checkRoleMiddleware(['RECRUITER', 'ADMIN']), UserController.getCandidates);
userRouter.get('/', checkRoleMiddleware(['ADMIN']), UserController.getAllUsers);
userRouter.get('/:id', authMiddleware, UserController.getUser);
userRouter.put('/:id', authMiddleware, UserController.updateUserInfo);
userRouter.delete('/:id', checkRoleMiddleware(['ADMIN']), UserController.deleteUser);
