# Back-end

Node.js/Express API with Prisma ORM and Better Auth.

## Prerequisites

- Node.js 20+
- MariaDB (or run from root with Docker Compose)

## Local setup

```bash
npm install
```

Create `back-end/.env`:

```env
DATABASE_URL=mysql://user:password@localhost:3306/inventory
BETTER_AUTH_SECRET=your-secret-here
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

Run migrations and start:

```bash
npx prisma migrate dev
npm run start
```

API is available at `http://localhost:3000`.

## Route model

| Path | Description |
|---|---|
| `GET /health` | Health check (includes DB check) |
| `GET /ready` | Readiness probe |
| `GET /api-docs` | Swagger UI |
| `/api/auth/*` | Better Auth routes |
| `/inventorys/*` | Inventory routes |
| `/items/*` | Item routes |
| `/soldItems/*` | Sold item routes |
| `/priceVariables/*` | Price variable routes |
| `/users/*` | User routes |

In production, app routes are typically reached through frontend rewrite (`/api/backend/*`) and not directly exposed on public ingress (except optional `/api/auth/*` exposure).

## Production env notes

- `FRONTEND_URL` and `BACKEND_URL` must be valid absolute URLs (`http://...` or `https://...`).
- `DATABASE_URL` password must be URL-encoded when it contains special characters.
- If using persistent DB storage, database credentials can drift from updated secrets; rotate the DB user password before migrations when needed.

## Testing

```bash
npm test
```

Tests require a reachable MariaDB instance via `DATABASE_URL`.

## Troubleshooting quick hits

- **`Prisma P1000` auth error**: verify `DATABASE_URL` credentials and MariaDB user password match.
- **`Prisma P1001` host parse issues**: confirm special characters in DB password are URL-encoded.
- **SoldItems 500 around cash field**: app uses `paidCash`, DB legacy column is mapped from `payedCash` via Prisma schema.

For full architecture and deployment flow, see [root README](../README.md).
