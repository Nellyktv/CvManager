import type { Request, Response } from 'express';
import type { IdParams } from '../types/http.js';
import userService from '../service/user-service.js';
import { ApiError } from '../errors/ApiError.js';
import { getAuthUser } from '../utils/validation.js';

const registration = async (req: Request, res: Response) => {
    const {
        firstName,
        lastName,
        email,
        password,
    } = req.body;

    const token = await userService.registration(
        firstName,
        lastName,
        email,
        password
    );

    return res.json({ token });
};

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const token = await userService.login(email, password);

    return res.json({ token });
};

const googleAuth = async (req: Request, res: Response) => {
    const { credential } = req.body;

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
    const { id } = req.params;

    const user = await userService.getUserById(id);

    return res.json({ user });
};

const updateUserInfo = async (req: Request<IdParams>, res: Response) => {
    const user = getAuthUser(req);
    const { id } = req.params;

    const isOwner = Number(id) === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isOwner && !isAdmin) {
        throw ApiError.forbidden(
            'You can edit only your own profile'
        );
    }

    if (req.body.role && !isAdmin) {
        throw ApiError.forbidden(
            'Only admin can change roles'
        );
    }

    if (req.body.isBlocked !== undefined && !isAdmin) {
        throw ApiError.forbidden(
            'Only admin can block or unblock users'
        );
    }

    const result = await userService.updateUserInfo(
        id,
        req.body
    );

    return res.json(result);
};

const deleteUser = async (req: Request<IdParams>, res: Response) => {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    return res.json(result);
};

const activate = async (req: Request<{ link: string }>, res: Response) => {
    const { link } = req.params;

    await userService.activate(link);

    return res.redirect(process.env.CLIENT_URL as string);
};

const checkAuth = async (req: Request, res: Response) => {
    const token = userService.refreshToken(getAuthUser(req));

    return res.json({ token });
};

export default {
    registration,
    login,
    googleAuth,
    getAllUsers,
    getCandidates,
    getUser,
    updateUserInfo,
    deleteUser,
    activate,
    checkAuth,
};