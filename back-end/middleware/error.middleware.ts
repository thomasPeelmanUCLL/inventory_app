import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * Custom error class for controlled error responses
 */
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(message: string, statusCode: number, isOperational = true, details?: any) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;
        
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Helper functions to create common errors
 */
export const createError = {
    badRequest: (message: string, details?: any) => new AppError(message, 400, true, details),
    unauthorized: (message = 'Unauthorized') => new AppError(message, 401),
    forbidden: (message = 'Forbidden') => new AppError(message, 403),
    notFound: (message = 'Resource not found') => new AppError(message, 404),
    conflict: (message: string) => new AppError(message, 409),
    unprocessable: (message: string, details?: any) => new AppError(message, 422, true, details),
    tooManyRequests: (message = 'Too many requests') => new AppError(message, 429),
    internal: (message = 'Internal server error') => new AppError(message, 500, false),
};

/**
 * Centralized error handling middleware
 * Sanitizes error responses to prevent information leakage
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Always log the full error for debugging (but not in response)
    console.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString(),
        userId: (req as any).user?.id,
    });

    // Handle Zod validation errors
    if (err instanceof ZodError) {
        const errors = err.errors.map(error => ({
            field: error.path.join('.'),
            message: error.message,
        }));
        
        return res.status(400).json({
            error: 'Validation failed',
            details: errors,
            timestamp: new Date().toISOString(),
        });
    }

    // Handle custom AppError instances
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            error: err.message,
            ...(err.details && { details: err.details }),
            timestamp: new Date().toISOString(),
        });
    }

    // Handle Prisma errors
    if (err.code && typeof err.code === 'string') {
        // Prisma error codes start with P
        if (err.code.startsWith('P')) {
            const statusCode = getPrismaErrorStatusCode(err.code);
            const message = getPrismaErrorMessage(err.code);
            
            return res.status(statusCode).json({
                error: message,
                timestamp: new Date().toISOString(),
            });
        }
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            timestamp: new Date().toISOString(),
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            timestamp: new Date().toISOString(),
        });
    }

    // Handle known operational errors
    if (err.statusCode && err.message) {
        return res.status(err.statusCode).json({
            error: err.message,
            timestamp: new Date().toISOString(),
        });
    }

    // Default: Don't leak internal error details
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return res.status(500).json({
        error: 'Internal server error',
        ...(isDevelopment && { details: err.message }), // Only in development
        timestamp: new Date().toISOString(),
    });
};

/**
 * Map Prisma error codes to appropriate HTTP status codes
 */
function getPrismaErrorStatusCode(code: string): number {
    switch (code) {
        case 'P2002': // Unique constraint failed
            return 409;
        case 'P2014': // Invalid ID
        case 'P2023': // Inconsistent column data
            return 400;
        case 'P2025': // Record not found
            return 404;
        case 'P2016': // Query interpretation error
        case 'P2017': // Records not connected
            return 400;
        default:
            return 500;
    }
}

/**
 * Map Prisma error codes to user-friendly messages
 */
function getPrismaErrorMessage(code: string): string {
    switch (code) {
        case 'P2002':
            return 'A record with this information already exists';
        case 'P2014':
            return 'Invalid ID provided';
        case 'P2025':
            return 'Record not found';
        case 'P2016':
            return 'Query interpretation error';
        case 'P2017':
            return 'Records are not properly connected';
        case 'P2023':
            return 'Inconsistent column data';
        default:
            return 'Database operation failed';
    }
}

/**
 * Async error wrapper to catch async route handler errors
 */
export const asyncHandler = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404 handler for unmatched routes
 */
export const notFoundHandler = (req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString(),
    });
};
