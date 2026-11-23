import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { afterEach, expect, it, vi } from 'vitest';

vi.mock('../models/models.js', () => ({
    User: { findOne: vi.fn(), findOrCreate: vi.fn(), findByPk: vi.fn(), update: vi.fn() },
}));

const { User } = await import('../models/models.js');
const { default: service } = await import('./user-service.js');

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.resetAllMocks();
});

it('does not use Google email verification for an address hosted by another provider', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
    const verify = vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ sub: 'google-id', email: 'anna@example.com', email_verified: true }),
    } as never);

    await expect(service.googleLogin('test-credential')).rejects.toMatchObject({ status: 403 });
    expect(verify).toHaveBeenCalledWith({ idToken: 'test-credential', audience: 'test-client-id' });
    expect(User.findOne).not.toHaveBeenCalled();
});

it('requests only public fields when another user reads a profile', async () => {
    vi.mocked(User.findByPk).mockResolvedValue({ id: 1 } as never);
    await service.getUserById(1, false);

    expect(User.findByPk).toHaveBeenCalledWith(1, {
        attributes: ['id', 'firstName', 'lastName', 'role'],
    });
});

it('lets a previously unconfirmed user sign in after Google verifies the address', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
    vi.stubEnv('SECRET_KEY_ROLE', 'test-signing-secret');
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ sub: 'google-id', email: 'anna@gmail.com', email_verified: true }),
    } as never);
    vi.mocked(User.findOne).mockResolvedValue(null);
    vi.mocked(User.findOrCreate).mockResolvedValue([{
        id: 7, email: 'anna@gmail.com', role: 'CANDIDATE', isActivated: false, googleSubject: null,
    }, false] as never);
    vi.mocked(User.update).mockResolvedValue([1] as never);

    const token = await service.googleLogin('test-credential');

    expect(User.update).toHaveBeenCalledWith(
        { googleSubject: 'google-id', isActivated: true, activationLink: null },
        { where: { id: 7, googleSubject: null, isBlocked: false } },
    );
    expect(jwt.verify(token, 'test-signing-secret')).toMatchObject({ id: 7, provider: 'google' });
});

it('prevents Google accounts from claiming a reserved fixture address', async () => {
    vi.stubEnv('GOOGLE_CLIENT_ID', 'test-client-id');
    vi.spyOn(OAuth2Client.prototype, 'verifyIdToken').mockResolvedValue({
        getPayload: () => ({ sub: 'id', email: 'admin@demo.com', hd: 'demo.com', email_verified: true }),
    } as never);

    await expect(service.googleLogin('test-credential')).rejects.toMatchObject({ status: 403 });
    expect(User.findOne).not.toHaveBeenCalled();
});
