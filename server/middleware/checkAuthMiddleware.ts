import type { RequestHandler } from 'express';
import { ApiError } from '../errors/ApiError.js';
import { User } from '../models/models.js';
import type { UserRole } from '../types/auth.js';
import { getBearerToken, verifyToken } from './verifyToken.js';

export const authenticate = (roles?: readonly UserRole[]): RequestHandler => async (req, _res, next) => {
    let id: number;
    try {
        id = verifyToken(getBearerToken(req));
    } catch {
        return next(ApiError.unauthorized('User is unauthorized'));
    }

    const user = await User.findByPk(id, {
        attributes: ['id', 'email', 'role', 'isBlocked', 'isActivated'],
    });
    if (!user || user.isBlocked) {
        return next(ApiError.forbidden('Account unavailable'));
    }
    if (!user.isActivated) {
        return next(ApiError.forbidden('Email address is not verified'));
    }
    if (roles && !roles.includes(user.role)) {
        return next(ApiError.forbidden('Access denied'));
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    next();
};

export default authenticate();
