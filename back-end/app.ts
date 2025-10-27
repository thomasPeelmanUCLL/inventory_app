import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { userRouter } from './controller/user.routes';
import { inventoryRouter } from './controller/inventory.routes';
import { itemRouter } from './controller/item.routes';
import { soldItemRouter } from './controller/soldItem.routes';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import {priceVariableRouter} from "./controller/priceVariable.routes";

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration - must specify exact origin when using credentials
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Better Auth routes - must be BEFORE express.json() middleware
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parsing middleware - AFTER auth routes
app.use(express.json());

// Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory Management API',
            version: '1.0.0',
            description: `API for managing inventories, items, and sales.

**Authentication:**

This API uses Better Auth for session-based authentication with cookies.

**Better Auth Endpoints:**
- POST \`/api/auth/sign-up/email\` - Register new user
- POST \`/api/auth/sign-in/email\` - Login user
- POST \`/api/auth/sign-out\` - Logout user
- GET \`/api/auth/get-session\` - Get current session

**For authenticated requests:**
After signing in, the session cookie will be automatically included in requests.
For API clients (like Swagger), you can also use Bearer token authentication with the session token.`,
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);


// Health check
app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root route
app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Inventory Management API',
        documentation: `/api-docs`,
        health: `/health`,
        auth: '/api/auth/*'
    });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err.message);
    res.status(400).json({
        error: err.message || 'An error occurred',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Route not found',
        path: req.path,
        method: req.method,
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
});

export default app;
