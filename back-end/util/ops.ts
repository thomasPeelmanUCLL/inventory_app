import { Router, Request, Response, NextFunction } from 'express';
import { createError } from '../middleware/error.middleware';

// Simple request timer to log slow requests (non-invasive)
export function requestTimer(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const ms = Number(end - start) / 1_000_000;
        if (ms > 500) {
            console.warn(`[SLOW] ${req.method} ${req.originalUrl} - ${ms.toFixed(1)}ms`);
        }
    });
    next();
}

// Basic DB connectivity check helper (works with Prisma client via repository/database.ts)
export async function checkDatabase(): Promise<{ ok: boolean; error?: string; latency?: number }> {
    try {
        const start = process.hrtime.bigint();
        // Lazy import to avoid circular deps
        const db = (await import('../repository/database')).default;
        await db.$queryRaw`SELECT 1`;
        const end = process.hrtime.bigint();
        const latencyMs = Number(end - start) / 1_000_000;

        return { ok: true, latency: Math.round(latencyMs * 100) / 100 };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'Unknown DB error' };
    }
}

// Enhanced readiness check with lightweight queries
export async function checkReadiness(): Promise<{
    ready: boolean;
    database: { ok: boolean; latency?: number; error?: string };
    environment: { ok: boolean; errors: string[] };
    services: { ok: boolean; errors: string[] };
}> {
    const results = {
        ready: true,
        database: { ok: false },
        environment: { ok: true, errors: [] as string[] },
        services: { ok: true, errors: [] as string[] },
    };

    // Check database
    results.database = await checkDatabase();
    if (!results.database.ok) results.ready = false;

    // Check environment variables in production
    if (process.env.NODE_ENV === 'production') {
        if (!process.env.DATABASE_URL) {
            results.environment.ok = false;
            results.environment.errors.push('DATABASE_URL missing');
        }
        if (!process.env.FRONTEND_URL) {
            results.environment.ok = false;
            results.environment.errors.push('FRONTEND_URL missing');
        }
        if (!process.env.BETTER_AUTH_SECRET) {
            results.environment.ok = false;
            results.environment.errors.push('BETTER_AUTH_SECRET missing');
        }
    }
    if (!results.environment.ok) results.ready = false;

    // Check basic services (lightweight queries)
    try {
        const db = (await import('../repository/database')).default;

        // Quick count queries to verify tables exist and are accessible
        const [userCount, inventoryCount] = await Promise.all([
            db.user.count({ take: 1 }),
            db.inventory.count({ take: 1 }),
        ]);

        if (typeof userCount !== 'number' || typeof inventoryCount !== 'number') {
            results.services.ok = false;
            results.services.errors.push('Invalid table structure');
        }
    } catch (e: any) {
        results.services.ok = false;
        results.services.errors.push(`Service check failed: ${e.message}`);
    }

    if (!results.services.ok) results.ready = false;

    return results;
}

// Request ID generator for correlation
export function addRequestId(req: Request, res: Response, next: NextFunction) {
    const requestId = Math.random().toString(36).substring(2, 15);
    (req as any).requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
}

// Enhanced structured logging
export function logRequest(req: Request, res: Response, next: NextFunction) {
    const start = process.hrtime.bigint();
    const requestId = (req as any).requestId || 'unknown';

    res.on('finish', () => {
        const end = process.hrtime.bigint();
        const durationMs = Number(end - start) / 1_000_000;

        const logData = {
            requestId,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            duration: Math.round(durationMs * 100) / 100,
            ip: req.ip,
            userAgent: req.get('User-Agent')?.substring(0, 50) || 'unknown',
            timestamp: new Date().toISOString(),
        };

        // Log level based on status and duration
        if (res.statusCode >= 500) {
            console.error('[ERROR]', JSON.stringify(logData));
        } else if (res.statusCode >= 400) {
            console.warn('[WARN]', JSON.stringify(logData));
        } else if (durationMs > 1000) {
            console.warn('[SLOW]', JSON.stringify(logData));
        } else if (process.env.NODE_ENV === 'development') {
            console.log('[REQ]', JSON.stringify(logData));
        }
    });

    next();
}
