import { Router } from 'express';
import { userRouter } from './userRouter.js';
import { cvRouter } from './cvRouter.js';
import { positionRouter } from './positionRouter.js';
import { attributeRouter } from './attributeRouter.js';
import { skillsRouter } from './skillsRouter.js';
import { projectRouter } from './projectRouter.js';

export const allRoutes = Router();

allRoutes.use('/user', userRouter);
allRoutes.use('/cv', cvRouter);
allRoutes.use('/position', positionRouter);
allRoutes.use('/attribute', attributeRouter);
allRoutes.use('/skills', skillsRouter);
allRoutes.use('/project', projectRouter);
