"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[Error] ${req.method} ${req.path} - Status: ${statusCode} - Message: ${message}`);
    if (err.errors) {
        console.error(`[Error Details]`, err.errors);
    }
    // Handle Postgres/PostgREST errors surfaced through the data layer
    if (err.statusCode === 400 && (err.message === 'Duplicate field value entered')) {
        return res.status(400).json({
            success: false,
            message: 'Duplicate field value entered',
            error: err.message,
        });
    }
    // Handle Zod or Mongoose validation errors
    if (err.name === 'ValidationError' || err.message.includes('validation failed')) {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: err.errors || err.message,
        });
    }
    return res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
