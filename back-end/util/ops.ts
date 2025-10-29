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
export async function checkDatabase(): Promise<{ ok: boolean; error?: string }> {
    try {
        // Lazy import to avoid circular deps
        const db = (await import('../repository/database')).default;
        await db.$queryRaw`SELECT 1`;
        return { ok: true };
    } catch (e: any) {
        return { ok: false, error: e?.message || 'Unknown DB error' };
    }
}
