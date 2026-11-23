import { rateLimit } from 'express-rate-limit';
import { getAuthUser } from '../utils/validation.js';

const options = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { message: 'Too many requests. Try again later.' },
} as const;

export const authenticationLimiter = rateLimit({ ...options, limit: 25 });
export const integrationLimiter = () =>
    rateLimit({ ...options, limit: 10, keyGenerator: (req) => String(getAuthUser(req).id) });
