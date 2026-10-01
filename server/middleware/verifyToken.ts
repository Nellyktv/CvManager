import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '../types/auth.js';

export const getBearerToken = (req: Request) => req.headers.authorization!.split(' ')[1];

export const verifyToken = (token: string) =>
    jwt.verify(token, process.env.SECRET_KEY_ROLE as string) as AuthUser;
