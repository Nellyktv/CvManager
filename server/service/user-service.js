import { ApiError } from '../errors/ApiError.js';
import { User } from '../models/models.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OAuth2Client } from 'google-auth-library';
import mailService from './mail-service.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateJwt = (id, email, role) => {
    return jwt.sign(
        { id, email, role },
        process.env.SECRET_KEY_ROLE,
        { expiresIn: '24h' }
    );
};

const userService = {
    async googleLogin(credential) {
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, given_name, family_name } = payload;

        let user = await User.findOne({
            where: { email },
        });

        if (!user) {
            user = await User.create({
                firstName: given_name || '',
                lastName: family_name || '',
                email,
                role: 'CANDIDATE',
                isActivated: true,
            });

        }
        if (user.isBlocked) {
            throw ApiError.forbidden('Your account has been blocked');
        }
        return generateJwt(user.id, user.email, user.role);
    },

    async registration(firstName, lastName, email, password) {
        if (!email || !password) {
            throw ApiError.badRequest('Invalid email or password');
        }

        const existingUser = await User.findOne({
            where: { email },
        });

        if (existingUser) {
            throw ApiError.badRequest(
                'An account with this email is already registered'
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const activationLink = uuidv4();

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'CANDIDATE',
            activationLink,
        });

        mailService
            .sendActivationMail(
                email,
                `${process.env.API_URL}/api/user/activate/${activationLink}`
            )
            .catch((error) => {
                console.error('MAIL ERROR:', error.message);
            });

        return generateJwt(user.id, user.email, user.role);
    },

    async login(email, password) {
        let user = await User.findOne({ where: { email } });
        if (!user) {
            throw ApiError.badRequest('Invalid email or password');
        }

        if (!user.password) {
            throw ApiError.badRequest('This account was registered via Google, please sign in with Google');
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            user.password
        );

        if (!isPasswordCorrect) {
            throw ApiError.badRequest('Invalid email or password');
        }


        if (user.isBlocked) {
            throw ApiError.forbidden('Your account has been blocked');
        }

        return generateJwt(user.id, user.email, user.role);


    },

    async updateUserInfo(id, { firstName, lastName, password, role, isBlocked }) {
        const targetUser = await User.findByPk(id);

        if (isBlocked && targetUser.role === 'ADMIN') {
            throw ApiError.forbidden('Cannot block an administrator');
        }

        const updatedData = {
            firstName,
            lastName,
            role,
            isBlocked,
        };

        if (password) {
            updatedData.password = await bcrypt.hash(password, 10);
        }
        const [updatedRows] = await User.update(updatedData, {
            where: { id },
        });
        if (!updatedRows) {
            throw ApiError.notFound('User not found');
        }

        return {
            message: 'User info was updated',
        };
    },

    async getAllUsers() {
        return await User.findAll({
            attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'role',
                'isActivated',
                'isBlocked'
            ],
        });
    },

    async getCandidates() {
        return await User.findAll({
            where: { role: 'CANDIDATE' },
            attributes: ['id', 'firstName', 'lastName'],
        });
    },

    async getUserById(id) {
        const user = await User.findByPk(id, {
            attributes: [
                'id',
                'firstName',
                'lastName',
                'email',
                'role',
                'isBlocked'
            ],
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        return user;
    },

    async deleteUser(id) {
        const deletedRows = await User.destroy({
            where: { id },
        });

        if (!deletedRows) {
            throw ApiError.notFound('User not found');
        }

        return 'User was deleted';
    },

    refreshToken(user) {
        return generateJwt(user.id, user.email, user.role);
    },

    async activate(activationLink) {
        const user = await User.findOne({
            where: { activationLink },
        });

        if (!user) {
            throw ApiError.badRequest('Invalid activation link');
        }

        user.isActivated = true;
        await user.save();
    },
};

export default userService;
