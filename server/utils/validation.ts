import { ZodError } from 'zod';
import { ApiError } from '../errors/ApiError.js';
import { isValidDateRange, type DateRange } from '../schemas/cvContentSchema.js';
import type { AuthUser } from '../types/auth.js';

export const parseOrBadRequest = <T>(validate: (body: unknown) => T, body: unknown): T => {
    try {
        return validate(body);
    } catch (err) {
        if (err instanceof ZodError) {
            throw ApiError.badRequest(err.issues[0]?.message || 'Invalid request');
        }
        throw err;
    }
};

export const assertMergedDateRange = (existing: DateRange, data: DateRange) => {
    const range = {
        startDate: data.startDate !== undefined ? data.startDate : existing.startDate,
        endDate: data.endDate !== undefined ? data.endDate : existing.endDate,
    };
    if (!isValidDateRange(range)) {
        throw ApiError.badRequest('Invalid date range');
    }
};

export const getAuthUser = (req: { user?: AuthUser }): AuthUser => {
    if (!req.user) {
        throw ApiError.unauthorized('User is unauthorized');
    }
    return req.user;
};
