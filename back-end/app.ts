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
import { requestTimer, checkDatabase } from './util/ops';

const app = express();
const PORT = process.env.PORT || 3000;

// Apply lightweight request timing to spot slow endpoints
app.use(requestTimer);

/* rest of file remains the same as previous commit, omitted for brevity */

// Health check endpoint (no rate limiting)
app.get('/health', async (req: Request, res: Response) => {
    const db = await checkDatabase();
    res.status(db.ok ? 200 : 503).json({ 
        status: db.ok ? 'OK' : 'DEGRADED', 
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        environment: process.env.NODE_ENV || 'development',
        database: db.ok ? 'connected' : `error: ${db.error}`,
    });
});

export default app;
