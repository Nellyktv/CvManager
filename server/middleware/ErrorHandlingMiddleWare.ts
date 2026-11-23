import type { ErrorRequestHandler } from 'express';
import {ApiError} from '../errors/ApiError.js';

const  errorHandler: ErrorRequestHandler = (err, _req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message });
    }
    if (err?.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Invalid JSON' });
    }
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body is too large' });
    }
    console.error('UNEXPECTED ERROR:', err instanceof Error ? err.name : 'Unknown error');
    return  res.status(500).json({ message: 'An unexpected error occurred' });

}

export default errorHandler;
