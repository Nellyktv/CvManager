import type { RequestHandler } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { User } from '../models/models.js';
import { getBearerToken, verifyToken } from './verifyToken.js';


const checkAuthMiddleware: RequestHandler = async (req, _res, next) => {

    try {
        const token = getBearerToken(req);
        if (!token) {
            return next(ApiError.unauthorized('User is unauthorized'));
        }
        const userData = verifyToken(token);

       const user = await User.findByPk(userData.id)

        if (!user || user.isBlocked) {
            return next(ApiError.forbidden('Your account has been blocked'));
        }
        req.user = userData;
        next();

    } catch {
        return next(ApiError.unauthorized('User is unauthorized'));
    }




};
export default checkAuthMiddleware;
