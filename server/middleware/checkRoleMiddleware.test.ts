import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser, UserRole } from '../types/auth.js';

vi.mock('../models/models.js', () => ({
    User: { findByPk: vi.fn() },
}));

const { User } = await import('../models/models.js');
const { default: checkRoleMiddleware } = await import('./checkRoleMiddleware.js');

const findByPk = vi.mocked(User.findByPk);
const SECRET = 'test-secret';

const requestWithToken = (payload: Partial<AuthUser>) =>
    ({ headers: { authorization: `Bearer ${jwt.sign(payload, SECRET)}` } }) as Request;

const run = async (roles: UserRole[], req: Request) => {
    const next = vi.fn<(err?: unknown) => void>();
    await checkRoleMiddleware(roles)(req, {} as Response, next as NextFunction);
    return next;
};

const statusOf = (next: ReturnType<typeof vi.fn<(err?: unknown) => void>>) => (next.mock.calls[0][0] as { status?: number } | undefined)?.status;

describe('checkRoleMiddleware', () => {
    beforeEach(() => {
        process.env.SECRET_KEY_ROLE = SECRET;
        findByPk.mockReset();
    });

    it('rejects a request without an Authorization header', async () => {
        const next = await run(['ADMIN'], { headers: {} } as Request);

        expect(statusOf(next)).toBe(401);
    });

    it('rejects a token signed with a different secret', async () => {
        const req = {
            headers: { authorization: `Bearer ${jwt.sign({ id: 1, role: 'ADMIN' }, 'other-secret')}` },
        } as Request;

        const next = await run(['ADMIN'], req);

        expect(statusOf(next)).toBe(401);
    });

    it('rejects a user whose role is not allowed', async () => {
        const next = await run(['RECRUITER', 'ADMIN'], requestWithToken({ id: 1, role: 'CANDIDATE' }));

        expect(statusOf(next)).toBe(403);
        expect(findByPk).not.toHaveBeenCalled();
    });

    it('rejects a blocked user even with an allowed role', async () => {
        findByPk.mockResolvedValue({ id: 1, isBlocked: true } as never);

        const next = await run(['ADMIN'], requestWithToken({ id: 1, role: 'ADMIN' }));

        expect(statusOf(next)).toBe(403);
    });

    it('rejects a token for a user that no longer exists', async () => {
        findByPk.mockResolvedValue(null);

        const next = await run(['ADMIN'], requestWithToken({ id: 99, role: 'ADMIN' }));

        expect(statusOf(next)).toBe(403);
    });

    it('lets an allowed active user through and sets req.user', async () => {
        findByPk.mockResolvedValue({ id: 2, isBlocked: false } as never);
        const req = requestWithToken({ id: 2, email: 'r@demo.com', role: 'RECRUITER' });

        const next = await run(['RECRUITER', 'ADMIN'], req);

        expect(next).toHaveBeenCalledWith();
        expect(req.user).toMatchObject({ id: 2, role: 'RECRUITER' });
    });
});
