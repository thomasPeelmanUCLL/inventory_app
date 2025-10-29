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
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// Production environment validation
if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
        console.error('❌ FRONTEND_URL environment variable is required in production!');
        process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL environment variable is required!');
        process.exit(1);
    }
    console.log('✅ Production environment validated');
}

// Security headers (must be early in middleware chain)
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
            connectSrc: ["'self'"],
        },
    },
    crossOriginEmbedderPolicy: false, // Allow Swagger UI
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Enhanced rate limiting with better key generation
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `${req.ip}:auth`; // Separate namespace for auth limits
    }
});

// Much stricter rate limiting for actual login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Only 10 login attempts per 15 minutes
    message: {
        error: 'Too many login attempts, please try again later.',
        retryAfter: '15 minutes',
        hint: 'Consider checking your credentials or waiting before retrying.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => !req.path.includes('sign-in'),
    keyGenerator: (req) => {
        return `${req.ip}:login`; // Separate namespace for login attempts
    }
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60,
    message: {
        error: 'Too many API requests, please try again later.',
        retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Enhanced CORS configuration with multiple allowed origins
const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL].filter(Boolean)
    : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️  Blocked request from unauthorized origin: ${origin}`);
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
}));

// Apply rate limiting to auth routes (order matters)
app.use('/api/auth/*', authLimiter);
app.use('/api/auth/sign-in/*', loginLimiter);

// Better Auth routes - must be BEFORE express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parsing middleware with enhanced error handling
app.use(express.json({ 
    limit: '10mb',
    verify: (req: any, res, buf) => {
        req.rawBody = buf; // Store raw body for signature verification if needed
    }
}));

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Handle JSON parsing errors specifically (before general error handler)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
        console.warn(`JSON Parse Error from ${req.ip}: ${err.message}`);
        return res.status(400).json({
            error: 'Invalid JSON format',
            message: 'Request body must be valid JSON',
            timestamp: new Date().toISOString()
        });
    }
    next(err);
});

// Apply rate limiting to API routes
app.use(['/users', '/inventorys', '/items', '/soldItems', '/priceVariables'], apiLimiter);

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Secure Inventory Management API',
            version: '2.1.0',
            description: `
# Secure Inventory Management API v2.1

Enterprise-grade inventory management with comprehensive security controls.

## 🔐 Security Features
- **Multi-tenant authorization** with role-based access control
- **Input validation & sanitization** with Zod schemas
- **Transactional stock management** preventing race conditions
- **Rate limiting** with IP-based throttling
- **Secure error handling** preventing information leakage
- **Security headers** via Helmet middleware
- **CORS protection** with environment-specific origins

## 🚀 Authentication

Uses Better Auth for session-based authentication with secure HTTP-only cookies.

### Authentication Endpoints:
- **POST** \`/api/auth/sign-up/email\` - Register new user
- **POST** \`/api/auth/sign-in/email\` - Login user (rate limited: 10/15min)
- **POST** \`/api/auth/sign-out\` - Logout user
- **GET** \`/api/auth/get-session\` - Get current session

## ⚡ Rate Limits
- **Authentication**: 100 requests per 15 minutes
- **Login attempts**: 10 attempts per 15 minutes  
- **API endpoints**: 60 requests per minute

## 🎯 Authorization
All API endpoints require authentication. Users can only access inventories they belong to through the \`InventoryUser\` relationship table.
            `,
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                betterAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'Session Token',
                    description: 'Better Auth session token (obtained from /api/auth/sign-in/email)',
                },
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'better-auth.session_token',
                    description: 'Session cookie (automatically set after login)',
                },
            },
        },
        security: [
            { betterAuth: [] },
            { cookieAuth: [] }
        ],
    },
    apis: ['./controller/*.ts', './controller/*.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Swagger UI with enhanced security
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customSiteTitle: 'Secure Inventory API Documentation',
    swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
    }
}));

// API Routes
app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);

// Health check endpoint (no rate limiting)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        features: {
            authentication: 'Better Auth',
            authorization: 'Multi-tenant RBAC',
            validation: 'Zod schemas',
            transactions: 'Atomic operations',
            rateLimiting: 'IP-based throttling',
            securityHeaders: 'Helmet middleware'
        }
    });
});

// Root route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Secure Inventory Management API v2.1',
        documentation: `/api-docs`,
        health: `/health`,
        auth: '/api/auth/*',
        security: {
            'multi-tenant-authorization': true,
            'input-validation': true,
            'transactional-operations': true,
            'rate-limiting': true,
            'secure-error-handling': true,
            'security-headers': true
        }
    });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Secure Inventory API v2.1 running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`🛡️  Security: Helmet headers, CORS protection, enhanced rate limiting`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🎯 Features: Multi-tenant auth, input validation, atomic transactions`);
});

export default app;
