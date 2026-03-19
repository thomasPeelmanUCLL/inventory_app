import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Middleware to validate Better Auth session and extract user
 * This properly validates the session cookie/token
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Use Better Auth's getSession method with proper headers
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (!session?.user) {
            return res.status(401).json({
                error: 'Unauthorized',
                message: 'Valid session required',
            });
        }

        // Attach user and session to request for route handlers
        req.headers['x-user-id'] = session.user.id;
        (req as any).user = session.user;
        (req as any).session = session.session;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired session',
        });
    }
};

/**
 * Optional middleware - extracts user if session exists but doesn't require it
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: fromNodeHeaders(req.headers),
        });

        if (session?.user) {
            req.headers['x-user-id'] = session.user.id;
            (req as any).user = session.user;
            (req as any).session = session.session;
        }

        next();
    } catch (error) {
        // Silently fail for optional auth
        next();
    }
};
