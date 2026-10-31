import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './controller/user.routes';
import { inventoryRouter } from './controller/inventory.routes';
import { itemRouter } from './controller/item.routes';
import { soldItemRouter } from './controller/soldItem.routes';
import { priceVariableRouter } from './controller/priceVariable.routes';
import { integrationRouter } from './controller/integration.routes';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestTimer, checkDatabase, checkReadiness, addRequestId, logRequest } from './util/ops';

const app = express();
const PORT = process.env.PORT || 3000;

function isValidHttpUrl(value?: string): boolean {
    if (!value) return false;
    try {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
        return false;
    }
}

if (process.env.NODE_ENV === 'production') {
    const required: Record<string, string | undefined> = {
        FRONTEND_URL: process.env.FRONTEND_URL,
        BACKEND_URL: process.env.BACKEND_URL,
        DATABASE_URL: process.env.DATABASE_URL,
        BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    };

    const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([key]) => key);

    if (missing.length > 0) {
        console.error(`Missing required environment variables: ${missing.join(', ')}`);
        process.exit(1);
    }

    const invalidUrls: string[] = [];
    if (!isValidHttpUrl(process.env.FRONTEND_URL)) invalidUrls.push('FRONTEND_URL');
    if (!isValidHttpUrl(process.env.BACKEND_URL)) invalidUrls.push('BACKEND_URL');

    if (invalidUrls.length > 0) {
        console.error(`Invalid URL format for: ${invalidUrls.join(', ')}`);
        process.exit(1);
    }

    console.log('Production environment validated');
}

app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'"],
            },
        },
        crossOriginEmbedderPolicy: false,
        hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    }),
);

app.set('trust proxy', 1);
app.use(addRequestId);
app.use(logRequest);
app.use(requestTimer);

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}:auth`,
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: '15 minutes',
        hint: 'Check your credentials',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.path.includes('sign-in'),
    keyGenerator: (req) => `${req.ip}:login`,
});

const readLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    message: { error: 'Too many read requests, please try again later.', retryAfter: '1 minute' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !['GET', 'HEAD'].includes(req.method),
});

const writeLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: { error: 'Too many write requests, please try again later.', retryAfter: '1 minute' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => ['GET', 'HEAD'].includes(req.method),
});

const allowedOrigins =
    process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL as string].filter(Boolean)
        : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            console.warn(`CORS: Blocked request from unauthorized origin: ${origin}`);
            return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
        exposedHeaders: [
            'X-RateLimit-Limit',
            'X-RateLimit-Remaining',
            'X-RateLimit-Reset',
            'X-Request-ID',
        ],
    }),
);

app.use('/api/auth/*', authLimiter);
app.use('/api/auth/sign-in/*', loginLimiter);
app.all('/api/auth/*', toNodeHandler(auth));

app.use(
    express.json({
        limit: '10mb',
        verify: (req: any, _res, buf) => {
            req.rawBody = buf;
        },
    }),
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
        const requestId = (req as any).requestId;
        console.warn(`[${requestId}] JSON Parse Error from ${req.ip}: ${err.message}`);
        return res.status(400).json({
            error: 'Invalid JSON format',
            message: 'Request body must be valid JSON',
            requestId,
            timestamp: new Date().toISOString(),
        });
    }
    next(err);
});

app.use(
    ['/users', '/inventorys', '/items', '/soldItems', '/priceVariables'],
    readLimiter,
    writeLimiter,
);

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Secure Inventory Management API',
            version: '2.2.0',
            description: 'Secure inventory management API with authentication, authorization, and analytics.',
        },
        servers: [{ url: `http://localhost:${PORT}`, description: 'Development server' }],
        components: {
            securitySchemes: {
                betterAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'Session Token' },
                cookieAuth: { type: 'apiKey', in: 'cookie', name: 'better-auth.session_token' },
            },
        },
        security: [{ betterAuth: [] }, { cookieAuth: [] }],
    },
    apis: ['./controller/*.ts', './controller/*.js', './dto/*.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
        customSiteTitle: 'Secure Inventory API v2.2 Documentation',
        swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    }),
);

app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);
app.use('/integrations', integrationRouter);

app.get('/health', async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    const db = await checkDatabase();

    res.status(db.ok ? 200 : 503).json({
        status: db.ok ? 'OK' : 'DEGRADED',
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        requestId,
        database: {
            status: db.ok ? 'connected' : 'error',
            latency: db.latency ? `${db.latency}ms` : undefined,
            error: db.error,
        },
    });
});

app.get('/ready', async (req: Request, res: Response) => {
    const requestId = (req as any).requestId;
    const readiness = await checkReadiness();

    res.status(readiness.ready ? 200 : 503).json({
        ready: readiness.ready,
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        requestId,
        checks: {
            database: readiness.database,
            environment: readiness.environment,
            services: readiness.services,
        },
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
    });
});

app.get('/', (_req: Request, res: Response) => {
    res.json({
        message: 'Secure Inventory Management API v2.2',
        documentation: '/api-docs',
        health: '/health',
        readiness: '/ready',
        auth: '/api/auth/*',
    });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Secure Inventory API v2.2 running on http://localhost:${PORT}`);
    console.log(`Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`Health: http://localhost:${PORT}/health`);
    console.log(`Readiness: http://localhost:${PORT}/ready`);
    console.log(`Auth: http://localhost:${PORT}/api/auth/*`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

    if (process.env.NODE_ENV !== 'production') {
        console.log('CORS Origins:', allowedOrigins);
        console.log('Database:', process.env.DATABASE_URL ? 'configured' : 'missing');
    }
});

export default app;
