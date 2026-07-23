import { Router } from 'express';
import UserController from '../controllers/UserController.js';
import authMiddleware from '../middleware/checkAuthMiddleware.js';
import checkRoleMiddleware from '../middleware/checkRoleMiddleware.js';

export const userRouter = Router();

userRouter.post('/registration', UserController.registration);
userRouter.post('/login', UserController.login);
userRouter.post('/google', UserController.googleAuth);
userRouter.get('/activate/:link', UserController.activate);
userRouter.get('/auth', authMiddleware, UserController.checkAuth);
userRouter.get('/candidates', checkRoleMiddleware(['RECRUITER', 'ADMIN']), UserController.getCandidates);
userRouter.get('/', checkRoleMiddleware(['ADMIN']), UserController.getAllUsers);
userRouter.get('/:id', authMiddleware, UserController.getUser);
userRouter.put('/:id', authMiddleware, UserController.updateUserInfo);
userRouter.delete('/:id', checkRoleMiddleware(['ADMIN']), UserController.deleteUser);
