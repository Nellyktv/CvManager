import { ApiError } from '../errors/ApiError.js';
import { User } from '../models/models.js';
import jwt from 'jsonwebtoken';
import { OAuth2Client, type LoginTicket } from 'google-auth-library';
import type { AuthUser, UserRole } from '../types/auth.js';

interface UserInfoUpdate {
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    isBlocked?: boolean;
}

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateJwt = (id: number, email: string, role: UserRole) => {
    return jwt.sign(
        { id, email, role, provider: 'google' },
        process.env.SECRET_KEY_ROLE as string,
        { expiresIn: '24h' }
    );
};

const userService = {
    async googleLogin(credential: string) {
        const audience = process.env.GOOGLE_CLIENT_ID;
        if (!audience) throw ApiError.notFound('Google sign-in is unavailable');

        let ticket: LoginTicket;
        try {
            ticket = await googleClient.verifyIdToken({ idToken: credential, audience });
        } catch {
            throw ApiError.unauthorized('Invalid Google credential');
        }

        const payload = ticket.getPayload();
        if (!payload?.email || payload.email_verified !== true) {
            throw ApiError.badRequest('Google account must have a verified email');
        }
        const { email, sub, hd, given_name, family_name } = payload;
        if (email.toLowerCase().endsWith('@demo.com')) throw ApiError.forbidden('This address is reserved for demo records');
        if (!sub || (!email.toLowerCase().endsWith('@gmail.com') && !hd)) {
            throw ApiError.forbidden('Use email and password to sign in');
        }

        let user = await User.findOne({ where: { googleSubject: sub } });
        if (!user) {
            const [account, created] = await User.findOrCreate({
                where: { email },
                defaults: {
                    firstName: given_name || '',
                    lastName: family_name || '',
                    email,
                    googleSubject: sub,
                    role: 'CANDIDATE',
                    isActivated: true,
                },
            });
            if (!created && account.googleSubject !== sub) {
                const [linked] = await User.update({ googleSubject: sub, isActivated: true, activationLink: null }, {
                    where: {
                        id: account.id,
                        googleSubject: null,
                        isBlocked: false,
                    },
                });
                if (!linked) throw ApiError.forbidden('Account unavailable');
                account.isActivated = true;
            }
            user = account;
        }

        if (user.isBlocked) {
            throw ApiError.forbidden('Your account has been blocked');
        }
        if (!user.isActivated) {
            throw ApiError.forbidden('Email address is not verified');
        }
        return generateJwt(user.id, user.email, user.role);
    },

    async updateUserInfo(id: number, { firstName, lastName, role, isBlocked }: UserInfoUpdate) {
        const targetUser = await User.findByPk(id);
        if (!targetUser) throw ApiError.notFound('User not found');

        if ((isBlocked ?? targetUser.isBlocked) && (role ?? targetUser.role) === 'ADMIN') {
            throw ApiError.forbidden('Cannot block an administrator');
        }

        await targetUser.update({ firstName, lastName, role, isBlocked });
        return { message: 'User info was updated' };
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

    async getUserById(id: number, includePrivate: boolean) {
        const user = await User.findByPk(id, {
            attributes: [
                'id',
                'firstName',
                'lastName',
                'role',
                ...(includePrivate ? ['email', 'isBlocked', 'salesforceContactId'] : []),
            ],
        });
        if (!user) {
            throw ApiError.notFound('User not found');
        }

        return user;
    },

    async deleteUser(id: number) {
        const deletedRows = await User.destroy({
            where: { id },
        });

        if (!deletedRows) {
            throw ApiError.notFound('User not found');
        }

        return 'User was deleted';
    },

    refreshToken(user: AuthUser) {
        return generateJwt(user.id, user.email, user.role);
    },

};

export default userService;
