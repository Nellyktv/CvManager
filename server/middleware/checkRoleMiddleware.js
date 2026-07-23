import { ApiError } from '../errors/ApiError.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/models.js';



 const checkMiddleware = (roles) => async(req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        if (!token) {
            return next(ApiError.unauthorized('User is unauthorized'));
        }
        const userData = jwt.verify(token, process.env.SECRET_KEY_ROLE);
        if (!roles.includes(userData.role)) {
            return next(ApiError.forbidden('Access denied'));
        }

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

export default checkMiddleware;