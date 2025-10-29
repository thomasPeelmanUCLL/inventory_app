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
import { requestTimer, checkDatabase, checkReadiness, addRequestId, logRequest } from './util/ops';

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
  if (!process.env.BETTER_AUTH_SECRET) {
    console.error('❌ BETTER_AUTH_SECRET environment variable is required!');
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

// Trust proxy and add request correlation
app.set('trust proxy', 1);
app.use(addRequestId); // Add unique request ID for tracing
app.use(logRequest); // Structured logging
app.use(requestTimer); // Performance monitoring

// Enhanced rate limiters with better granularity
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
  message: { error: 'Too many login attempts, please try again later.', retryAfter: '15 minutes', hint: 'Check your credentials' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => !req.path.includes('sign-in'),
  keyGenerator: req => `${req.ip}:login`,
});

// Separate limiters for read vs write operations
const readLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120, // Higher limit for GET requests
  message: { error: 'Too many read requests, please try again later.', retryAfter: '1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => !['GET', 'HEAD'].includes(req.method),
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30, // Stricter limit for write operations
  message: { error: 'Too many write requests, please try again later.', retryAfter: '1 minute' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: req => ['GET', 'HEAD'].includes(req.method),
});

// CORS with better logging
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.FRONTEND_URL as string].filter(Boolean)
  : ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`⚠️  CORS: Blocked request from unauthorized origin: ${origin}`);
    return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'X-Request-ID'],
}));

// Auth rate limiting
app.use('/api/auth/*', authLimiter);
app.use('/api/auth/sign-in/*', loginLimiter);

// Better Auth routes (before json())
app.all('/api/auth/*', toNodeHandler(auth));

// JSON parsing with enhanced error reporting
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => { req.rawBody = buf; }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    const requestId = (req as any).requestId;
    console.warn(`[${requestId}] JSON Parse Error from ${req.ip}: ${err.message}`);
    return res.status(400).json({
      error: 'Invalid JSON format',
      message: 'Request body must be valid JSON',
      requestId,
      timestamp: new Date().toISOString()
    });
  }
  next(err);
});

// Apply granular rate limiting to API routes
app.use(['/users', '/inventorys', '/items', '/soldItems', '/priceVariables'], readLimiter, writeLimiter);

// Swagger with enhanced security info
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Secure Inventory Management API',
      version: '2.2.0',
      description: `
# Secure Inventory Management API v2.2

## 🔐 Security & Architecture
- **Multi-tenant authorization** with role-based access control
- **Input validation** with Zod schemas (client + server)
- **Transactional operations** preventing race conditions
- **Rate limiting** with read/write differentiation
- **DTO mappers** for clean API responses
- **Request correlation** with X-Request-ID headers
- **Structured logging** for observability

## 🚀 Authentication Flow
Better Auth with secure HTTP-only cookies and session management.

## ⚡ Rate Limits
- **Auth**: 100/15min, **Login**: 10/15min
- **Read APIs**: 120/min, **Write APIs**: 30/min

## 🎯 Endpoints
- **Health**: \`/health\` - Basic health check
- **Readiness**: \`/ready\` - Comprehensive readiness probe
- **Docs**: \`/api-docs\` - Interactive API documentation
      `
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
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
  customSiteTitle: 'Secure Inventory API v2.2 Documentation',
  swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
}));

// Routes
app.use('/users', userRouter);
app.use('/inventorys', inventoryRouter);
app.use('/items', itemRouter);
app.use('/soldItems', soldItemRouter);
app.use('/priceVariables', priceVariableRouter);

// Enhanced Health Check (minimal, fast)
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
      error: db.error
    }
  });
});

// Readiness Probe (comprehensive)
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
    }
  });
});

// Enhanced Root Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'Secure Inventory Management API v2.2',
    documentation: '/api-docs',
    health: '/health',
    readiness: '/ready',
    auth: '/api/auth/*',
    features: {
      'multi-tenant-authorization': true,
      'input-validation': true,
      'transactional-operations': true,
      'dto-responses': true,
      'structured-logging': true,
      'request-correlation': true,
      'granular-rate-limiting': true,
      'security-headers': true,
    }
  });
});

// 404 then error handler
app.use(notFoundHandler);
app.use(errorHandler);

// Start server with enhanced logging
app.listen(PORT, () => {
  console.log(`🚀 Secure Inventory API v2.2 running on http://localhost:${PORT}`);
  console.log(`📚 Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health: http://localhost:${PORT}/health`);
  console.log(`✅ Readiness: http://localhost:${PORT}/ready`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/*`);
  console.log(`🛡️  Security: Helmet, CORS, rate limiting (read: 120/min, write: 30/min)`);
  console.log(`🎯 Architecture: DTOs, request correlation, structured logging`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log configuration in development
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📊 CORS Origins:`, allowedOrigins);
    console.log(`📛 Database: ${process.env.DATABASE_URL ? '✅ configured' : '❌ missing'}`);
  }
});

export default app;
