import userService from '../service/user-service.js';
import { ApiError } from '../errors/ApiError.js';

const registration = async (req, res) => {
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

const login = async (req, res) => {
    const { email, password } = req.body;

    const token = await userService.login(email, password);

    return res.json({ token });
};

const googleAuth = async (req, res) => {
    const { credential } = req.body;

    const token = await userService.googleLogin(credential);

    return res.json({ token });
};

const getAllUsers = async (req, res) => {
    const users = await userService.getAllUsers();

    return res.json({
        allUsers: users,
    });
};

const getCandidates = async (req, res) => {
    const candidates = await userService.getCandidates();

    return res.json({
        allCandidates: candidates,
    });
};

const getUser = async (req, res) => {
    const { id } = req.params;

    const user = await userService.getUserById(id);

    return res.json({ user });
};

const updateUserInfo = async (req, res) => {
    const { id } = req.params;

    const isOwner = Number(id) === req.user.id;
    const isAdmin = req.user.role === 'ADMIN';

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

const deleteUser = async (req, res) => {
    const { id } = req.params;

    const result = await userService.deleteUser(id);

    return res.json(result);
};

const activate = async (req, res) => {
    const { link } = req.params;

    await userService.activate(link);

    return res.redirect(process.env.CLIENT_URL);
};

const checkAuth = async (req, res) => {
    const token = userService.refreshToken(req.user);

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