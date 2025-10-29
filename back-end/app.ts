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

// Security headers
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
  crossOriginEmbedderPolicy: false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Trust proxy (rate limiting behind proxy)
app.set('trust proxy', 1);

// Request timing to spot slow handlers
app.use(requestTimer);

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many authentication attempts, please try again later.', retryAfter: '15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: req => `${req.ip}:auth`,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many login attempts, please try again later.', retryAfter: '15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => !req.path.includes('sign-in'),
  keyGenerator: req => `${req.ip}:login`,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Too many API requests, please try again later.', retryAfter: '1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL as string].filter(Boolean)
  : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`⚠️  Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
}));

// Auth rate limiting
app.use('/api/auth/*', authLimiter);
app.use('/api/auth/sign-in/*', loginLimiter);

// Better Auth routes (before json())
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parsing with error reporting
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// API rate limiting
app.use(['/users', '/inventorys', '/items', '/soldItems', '/priceVariables'], apiLimiter);

// Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Inventory Management API',
      version: '2.1.0',
      description: `\n# Secure Inventory Management API v2.1\n\n- Multi-tenant authorization, Zod validation, transactional stock\n- Rate limiting and security headers (Helmet)\n- CORS protection with environment-specific origins\n`
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
  apis: ['./controller/*.ts', './controller/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  customSiteTitle: 'Secure Inventory API Documentation',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
}));

// Routes
app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);

// Health
app.get('/health', async (_req: Request, res: Response) => {
  const db = await checkDatabase();
  res.status(db.ok ? 200 : 503).json({
    status: db.ok ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    version: '2.1.0',
    environment: process.env.NODE_ENV || 'development',
    database: db.ok ? 'connected' : `error: ${db.error}`,
  });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    message: 'Secure Inventory Management API v2.1',
    documentation: '/api-docs',
    health: '/health',
    auth: '/api/auth/*',
  });
});

// 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Secure Inventory API v2.1 running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/*`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
