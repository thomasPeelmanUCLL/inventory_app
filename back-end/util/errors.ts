/**
 * Errors that carry an HTTP status. Anything thrown as an AppError reaches the client with
 * its message; any other error becomes a generic 500 (see middleware/error.middleware.ts).
 */
export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly details?: unknown,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export const createError = {
    badRequest: (message: string, details?: unknown) => new AppError(message, 400, details),
    unauthorized: (message = 'Unauthorized') => new AppError(message, 401),
    forbidden: (message = 'Forbidden') => new AppError(message, 403),
    notFound: (message = 'Resource not found') => new AppError(message, 404),
    conflict: (message: string) => new AppError(message, 409),
};
