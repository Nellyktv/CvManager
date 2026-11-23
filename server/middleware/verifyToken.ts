import type { Request } from 'express';
import jwt from 'jsonwebtoken';

export const getBearerToken = (req: Request) =>
    /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '')?.[1];

export const verifyToken = (token: string | undefined): number => {
    if (!token) throw new Error('Missing token');
    const payload = jwt.verify(token, process.env.SECRET_KEY_ROLE as string, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || !Number.isSafeInteger(payload.id) || payload.id < 1 ||
        typeof payload.exp !== 'number' || payload.provider !== 'google') {
        throw new Error('Invalid session claims');
    }
    return payload.id;
};
