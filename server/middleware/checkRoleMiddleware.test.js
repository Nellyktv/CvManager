import { beforeEach, describe, expect, it, vi } from 'vitest';

const { User, jwt } = vi.hoisted(() => ({
  User: { findByPk: vi.fn() },
  jwt: { verify: vi.fn() },
}));

vi.mock('../models/models.js', () => ({ User }));
vi.mock('jsonwebtoken', () => ({ default: jwt }));

const checkRoleMiddleware = (await import('./checkRoleMiddleware.js')).default;

const PROFILE_EDUCATION_ROLES = ['CANDIDATE', 'ADMIN'];

const mockReq = () => ({
  headers: { authorization: 'Bearer token' },
  user: undefined,
});

const invoke = async (roles, tokenPayload) => {
  jwt.verify.mockReturnValue(tokenPayload);
  User.findByPk.mockResolvedValue({ id: tokenPayload.id, isBlocked: false });
  const req = mockReq();
  const next = vi.fn();
  await checkRoleMiddleware(roles)(req, {}, next);
  return { req, next };
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SECRET_KEY_ROLE = 'test-secret';
});

describe('checkRoleMiddleware profile/education gate', () => {
  it('allows CANDIDATE and ADMIN', async () => {
    for (const role of PROFILE_EDUCATION_ROLES) {
      const { req, next } = await invoke(PROFILE_EDUCATION_ROLES, { id: 1, role });
      expect(next).toHaveBeenCalledWith();
      expect(req.user).toEqual({ id: 1, role });
    }
  });

  it('denies RECRUITER with forbidden', async () => {
    const { next } = await invoke(PROFILE_EDUCATION_ROLES, {
      id: 9,
      role: 'RECRUITER',
    });

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toMatchObject({ status: 403, message: 'Access denied' });
  });
});
