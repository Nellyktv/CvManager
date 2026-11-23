import type { RequestHandler } from 'express';
import authMiddleware from './checkAuthMiddleware.js';

const optionalAuthMiddleware: RequestHandler = (req, res, next) => {
    if (req.headers.authorization === undefined) return next();
    return authMiddleware(req, res, next);
};

export default optionalAuthMiddleware;
