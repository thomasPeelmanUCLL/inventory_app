import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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

// Rate limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many authentication attempts, please try again later.',
        retryAfter: 15 * 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per windowMs
    message: {
        error: 'Too many API requests, please try again later.',
        retryAfter: 60 * 1000
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// CORS configuration - must specify exact origin when using credentials
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? process.env.FRONTEND_URL 
        : 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Trust proxy (important for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Apply rate limiting to auth routes
app.use('/api/auth/*', authLimiter);

// Better Auth routes - must be BEFORE express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parsing middleware - AFTER auth routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting to API routes
app.use(['/users', '/inventorys', '/items', '/soldItems', '/priceVariables'], apiLimiter);

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Secure Inventory Management API',
            version: '2.0.0',
            description: `
# Secure Inventory Management API

This API provides secure multi-tenant inventory management with proper authorization controls.

## Authentication

This API uses Better Auth for session-based authentication with secure cookies.

### Authentication Endpoints:
- **POST** \`/api/auth/sign-up/email\` - Register new user
- **POST** \`/api/auth/sign-in/email\` - Login user  
- **POST** \`/api/auth/sign-out\` - Logout user
- **GET** \`/api/auth/get-session\` - Get current session

## Authorization

All endpoints (except auth) require authentication. Users can only access inventories they belong to.

## Rate Limiting

- Auth endpoints: 100 requests per 15 minutes
- API endpoints: 60 requests per minute

## Security Features

- **Multi-tenant isolation**: Users can only access their own inventory data
- **Input validation**: All inputs are validated and sanitized
- **Transactional operations**: Stock updates are atomic to prevent race conditions
- **Secure error handling**: Internal errors are not exposed
- **Rate limiting**: Protection against abuse
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

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    customSiteTitle: 'Secure Inventory API Documentation'
}));

// API Routes
app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);

// Health check (no rate limiting)
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Root route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Secure Inventory Management API v2.0',
        documentation: `/api-docs`,
        health: `/health`,
        auth: '/api/auth/*',
        features: [
            'Multi-tenant authorization',
            'Input validation & sanitization',
            'Transactional stock management',
            'Rate limiting',
            'Secure error handling'
        ]
    });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Centralized error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`🚀 Secure Inventory API v2.0 running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
    console.log(`🛡️  Security features: Multi-tenant auth, rate limiting, input validation`);
    console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
