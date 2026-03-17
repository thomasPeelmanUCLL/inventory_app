# Back-end

Node.js / Express API server with Prisma ORM and Better Auth.

## Prerequisites

- Node.js 20+
- PostgreSQL (or use Docker Compose from the root)

## Setup

```bash
npm install
```

Create a `.env` file in this folder:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
BETTER_AUTH_SECRET=your-secret-here
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

Run migrations and start:

```bash
npx prisma migrate dev
npm run dev
```

The server runs on `http://localhost:3000`.

## Endpoints

| Path | Description |
|---|---|
| `GET /health` | Health check (includes DB latency) |
| `GET /ready` | Readiness probe |
| `GET /api-docs` | Swagger UI |
| `POST /api/auth/*` | Better Auth (sign-in, sign-up, session) |
| `/inventorys/*` | Inventory CRUD |
| `/items/*` | Item CRUD |
| `/soldItems/*` | Sales CRUD |
| `/priceVariables/*` | Price variable CRUD |
| `/users/*` | User lookup |

## Testing

```bash
npm test
```

Tests require a running PostgreSQL instance. The `DATABASE_URL` env var must point to a test database.

> For full setup, deployment, and architecture documentation see the [root README](../README.md).
