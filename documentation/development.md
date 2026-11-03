# Development Guide

## Local setup

```bash
docker compose up --build
```

Manual:

```bash
# back-end
cd back-end && npm install && npx prisma migrate dev && npm run start   # :3000
# front-end
cd front-end && npm install && npm run dev                              # :8080
```

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| DATABASE_URL | back-end | `mysql://user:pass@host:3306/inventory` |
| BETTER_AUTH_SECRET | back-end | session signing, required in prod |
| FRONTEND_URL | back-end | CORS and trusted origin |
| BACKEND_URL | back-end | Better Auth base URL |
| PORT | back-end | default 3000 |
| NODE_ENV | back-end | `production` enables strict env validation and strict CORS |
| INTEGRATION_TOKEN | back-end | token for `/integrations` |
| WEBSITE_INVENTORY_ID | back-end | inventory published to the website catalogue |
| NEXT_PUBLIC_API_URL | front-end, build time | Better Auth client base |
| INTERNAL_API_URL | front-end, runtime | rewrite target for `/api/backend/*` |

`back-end/.env` example:

```env
DATABASE_URL=mysql://user:password@localhost:3306/inventory
BETTER_AUTH_SECRET=change-me
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

`front-end/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
INTERNAL_API_URL=http://localhost:3000
```

## Front-end structure

Pages: `/`, `/Login`, `/Register`, `/Inventory`, `/Inventory/[id]` (overview and sell), `/manage`, `/history`, `/analytics`. API calls are centralised in `lib/api.ts`; auth client in `lib/auth-client.ts`.

## Quality gates

- Back-end: `npx tsc --noEmit`, `npm run lint`, Jest (`jest.config.js`, tests in `back-end/test`). CI does not run the Jest suite (VERIFY).
- Front-end: `npx tsc --noEmit`, `npm run build`.
- Prettier config at repo root.

## Adding an endpoint

1. Zod schema in `util/validators.ts`.
2. Route in `controller/` with `requireAuth`, `validateParams/Body`, and an `access.service` role check. Declare static paths before `/:id`.
3. Business logic in `service/`, DB access in `repository/`, DTO in `dto/`.
4. Mount in `app.ts` and add the path to the rate-limit list.
5. Update `documentation/api-reference.md`.

## Schema change

Edit `schema.prisma`, `npx prisma migrate dev --name <change>`, commit the migration, deploy, run `migrate deploy` in the cluster.
