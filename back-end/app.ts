import * as dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import * as bodyParser from 'body-parser';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { expressjwt } from 'express-jwt';
import helmet from 'helmet';

// BASIC CONFIGURATION
const app = express();
dotenv.config();
const port = process.env.APP_PORT || 3000;
app.use(cors());
app.use(express.json());
app.use(helmet());

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
            '/status,',
            '/images',
            '/hardwareComponents',
            '/inventory',
            //'/setup',
            //'/comments',
            // Read-only routes
            { url: /^\/images$/, methods: ['GET'] },
            { url: /^\/hardwareComponents$/, methods: ['GET'] },
            { url: /^\/setup\/.*/, methods: ['GET'] },
            { url: /^\/comments\/.*/, methods: ['GET'] },
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
            title: 'Courses API',
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
    apis: ['./controller/*.ts'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.listen(port || 3000, () => {
    console.log(`Back-end is running on port ${port}.`);
});

// USER ROUTES
import { userRouter } from './controller/user.routes';
app.use('/users', userRouter);

// INVENTORY ROUTES
import { inventoryRouter } from './controller/inventory.routes';
app.use('/inventory', inventoryRouter);


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({ status: 'unauthorized', message: err.message });
    } else if (err.name === 'CoursesError') {
        res.status(400).json({ status: 'domain error', message: err.message });
    } else {
        res.status(400).json({ status: 'application error', message: err.message });
    }
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something broke!' });
});
