import { Request, Response, NextFunction } from 'express';
import { fromNodeHeaders } from 'better-auth/node';
import { auth, Session, User } from '../lib/auth';
import { createError } from '../util/errors';

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace Express {
        interface Request {
            user?: User;
            session?: Session;
        }
    }
}

/** Validates the Better Auth session cookie/token and attaches the user to the request. */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
        if (!session?.user) {
            return res.status(401).json({ error: 'Unauthorized', message: 'Valid session required' });
        }
        req.user = session.user;
        req.session = session.session;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired session' });
    }
};

/** The authenticated user's id. Only valid behind requireAuth. */
export const currentUserId = (req: Request): string => {
    if (!req.user) throw createError.unauthorized();
    return req.user.id;
};
