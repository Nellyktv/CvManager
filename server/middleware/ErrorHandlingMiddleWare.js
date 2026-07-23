import {ApiError} from '../errors/ApiError.js';

const  errorHandler = (err, req, res, next) => {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message });
    }
    console.error('UNEXPECTED ERROR:', err);
    return  res.status(500).json({ message: 'An unexpected error occurred' });

}

export default errorHandler;