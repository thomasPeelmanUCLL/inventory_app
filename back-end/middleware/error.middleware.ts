import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../util/errors';

// Prisma error codes we can explain to the client; everything else is a 500
const PRISMA_ERRORS: Record<string, [number, string]> = {
    P2002: [409, 'A record with this information already exists'],
    P2003: [400, 'Referenced record does not exist'],
    P2014: [400, 'Invalid ID provided'],
    P2016: [400, 'Query interpretation error'],
    P2017: [400, 'Records are not properly connected'],
    P2023: [400, 'Inconsistent column data'],
    P2025: [404, 'Record not found'],
};

const send = (res: Response, status: number, body: Record<string, unknown>) =>
    res.status(status).json({ ...body, timestamp: new Date().toISOString() });

export const formatZodError = (error: ZodError) => ({
    error: 'Validation failed',
    details: error.errors.map((e) => ({ field: e.path.join('.'), message: e.message })),
});

/** Centralized error handler. Only AppError, validation and known Prisma messages reach the client. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        return send(res, err.statusCode, {
            error: err.message,
            ...(err.details !== undefined && { details: err.details }),
        });
    }
    if (err instanceof ZodError) return send(res, 400, formatZodError(err));

    const prismaError = typeof err?.code === 'string' ? PRISMA_ERRORS[err.code] : undefined;
    if (prismaError) return send(res, prismaError[0], { error: prismaError[1] });

    console.error('Unhandled error:', {
        message: err?.message,
        stack: err?.stack,
        url: req.url,
        method: req.method,
        userId: req.user?.id,
    });
    return send(res, 500, {
        error: 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { details: err?.message }),
    });
};

export const notFoundHandler = (req: Request, res: Response) =>
    send(res, 404, { error: 'Route not found', path: req.path, method: req.method });
