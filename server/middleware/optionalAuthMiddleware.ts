import type { RequestHandler } from 'express';
import { User } from '../models/models.js';
import { getBearerToken, verifyToken } from './verifyToken.js';


const optionalAuthMiddleware: RequestHandler = async (req, _res, next) => {

    try {
        const token = getBearerToken(req);
        if (!token) {
            return next();
        }
        const userData = verifyToken(token);

        const user = await User.findByPk(userData.id)

        if (!user || user.isBlocked) {
            return next();
        }

        req.user = userData;
        next();

    } catch {
        next();
    }

};
export default optionalAuthMiddleware;
