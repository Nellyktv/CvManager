import { googleBody, routeId, userUpdateBody } from '../schemas/requestSchemas.js';
import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import userService from '../service/user-service.js';
import { ApiError } from '../errors/ApiError.js';
import { getAuthUser, parseOrBadRequest } from '../utils/validation.js';

const googleConfig = (_req: Request, res: Response) =>
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID || null });

const googleAuth = async (req: Request, res: Response) => {
    const { credential } = parseOrBadRequest(googleBody.parse, req.body);

    const token = await userService.googleLogin(credential);

    return res.json({ token });
};

const getAllUsers = async (_req: Request, res: Response) => {
    const users = await userService.getAllUsers();

    return res.json({
        allUsers: users,
    });
};

const getCandidates = async (_req: Request, res: Response) => {
    const candidates = await userService.getCandidates();

    return res.json({
        allCandidates: candidates,
    });
};

const getUser = async (req: Request<IdParams>, res: Response) => {
    const id = parseOrBadRequest(routeId.parse, req.params.id);

    const requester = getAuthUser(req);
    const includePrivate = requester.id === id || requester.role === 'ADMIN';
    const user = await userService.getUserById(id, includePrivate);

    return res.json({ user });
};

const updateUserInfo = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const id = parseOrBadRequest(routeId.parse, req.params.id);

    const data = parseOrBadRequest(userUpdateBody.parse, req.body);
    const isOwner = id === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden(
            'You can edit only your own profile'
        );
    }

    if (data.role && !isAdmin) {
        throw ApiError.forbidden(
            'Only admin can change roles'
        );
    }

    if (data.isBlocked !== undefined && !isAdmin) {
        throw ApiError.forbidden(
            'Only admin can block or unblock users'
        );
    }

    const result = await userService.updateUserInfo(
        id,
        data,
    );

    return res.json(result);
};

const deleteUser = async (req: Request<IdParams>, res: Response) => {
    const id = parseOrBadRequest(routeId.parse, req.params.id);

    const result = await userService.deleteUser(id);

    return res.json(result);
};

const checkAuth = async (req: Request, res: Response) => {
    const token = userService.refreshToken(getAuthUser(req));

    return res.json({ token });
};

export default {
    googleConfig,
    googleAuth,
    getAllUsers,
    getCandidates,
    getUser,
    updateUserInfo,
    deleteUser,
    checkAuth,
};