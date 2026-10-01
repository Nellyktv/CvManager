import { describe, expect, it, vi } from 'vitest';
import type { NextFunction, Request, Response } from 'express';
import errorHandler from './ErrorHandlingMiddleWare.js';
import { ApiError } from '../errors/ApiError.js';

const createRes = (headersSent = false) => {
    const res = {
        headersSent,
        status: vi.fn(),
        json: vi.fn(),
    };
    res.status.mockReturnValue(res);
    res.json.mockReturnValue(res);
    return res;
};

const handle = (err: unknown, res: ReturnType<typeof createRes>, next = vi.fn<(err?: unknown) => void>()) =>
    errorHandler(err, {} as Request, res as unknown as Response, next as NextFunction);

describe('errorHandler', () => {
    it('returns the status and message of an ApiError', () => {
        const res = createRes();

        handle(ApiError.notFound('CV not found'), res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'CV not found' });
    });

    it('hides details of unexpected errors behind a 500', () => {
        const res = createRes();
        vi.spyOn(console, 'error').mockImplementation(() => {});

        handle(new Error('db password is wrong'), res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'An unexpected error occurred' });
    });

    it('passes the error on when the response was already sent', () => {
        const res = createRes(true);
        const next = vi.fn<(err?: unknown) => void>();
        const error = ApiError.badRequest('late');

        handle(error, res, next);

        expect(next).toHaveBeenCalledWith(error);
        expect(res.status).not.toHaveBeenCalled();
    });
});
