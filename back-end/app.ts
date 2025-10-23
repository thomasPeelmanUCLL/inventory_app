import * as dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { expressjwt } from 'express-jwt';
import helmet from 'helmet';
import { auth } from './lib/auth';
import { toNodeHandler } from "better-auth/node";

// BASIC CONFIGURATION
const app = express();
dotenv.config();
const port = process.env.APP_PORT || 3000;

app.use(cors({
    origin: 'http://localhost:8080', // Your Next.js frontend
    credentials: true
}));
app.use(express.json());
app.use(helmet());

// BETTER AUTH HANDLER - Must be BEFORE JWT middleware
app.all('/api/auth/*', toNodeHandler(auth.handler));

// JWT MIDDLEWARE
app.use(
    expressjwt({
        secret: process.env.JWT_SECRET || 'default_secret',
        algorithms: ['HS256'],
    }).unless({
        path: [
            '/api-docs',
            /^\/api-docs\/.*/,
            '/users/login',
            '/users/signup',
            '/status',
            /^\/api\/auth\/.*/,  // Allow Better Auth routes
            /^\/inventory(\/.*)?$/,
            /^\/item(\/.*)?$/,
            /^\/soldItem(\/.*)?$/,
        ],
    })
);

app.get('/status', (req, res) => {
    res.json({ message: 'Back-end is running...' });
});

// Swagger setup
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory API',
            version: '1.0.0',
        },
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./controller/*.ts'],
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// USER ROUTES
import { userRouter } from './controller/user.routes';
app.use('/users', userRouter);

// INVENTORY ROUTES
import { inventoryRouter } from './controller/inventory.routes';
app.use('/inventory', inventoryRouter);

// ITEM ROUTES
import { itemRouter } from './controller/item.routes';
app.use('/item', itemRouter);

// SOLD ITEM ROUTES
import { soldItemRouter } from './controller/soldItem.routes';
app.use('/soldItem', soldItemRouter);

// ERROR HANDLERS
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ status: 'unauthorized', message: err.message });
    } else if (err.name === 'InventoryError') {
        res.status(400).json({ status: 'domain error', message: err.message });
    } else {
        res.status(400).json({ status: 'application error', message: err.message });
    }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});

// START SERVER
app.listen(port || 3000, () => {
    console.log(`Back-end is running on port ${port}.`);
});
