# Front-end

Next.js (Pages Router) UI with TypeScript, Tailwind CSS, and Better Auth client integration.

## Prerequisites

- Node.js 20+
- Backend reachable at `http://localhost:3000` for local development

## Local setup

```bash
npm install
```

Create `front-end/.env.local`:

```env
# Public API base/fallback (must be https in production)
NEXT_PUBLIC_API_URL=http://localhost:3000

# Server-side rewrite target (never exposed to browser directly)
INTERNAL_API_URL=http://localhost:3000
```

Start dev server:

```bash
npm run dev
```

App runs on `http://localhost:8080`.

## Request flow

- Browser app calls: `/api/backend/*`
- Next.js rewrite forwards to: `INTERNAL_API_URL` (see `next.config.mjs`)
- In Kubernetes: `INTERNAL_API_URL` points to `inventory-backend.inventory.svc.cluster.local`

Auth client (`lib/auth-client.ts`) uses `/api/backend/api/auth` in browser mode, so cookies/session stay same-origin with the frontend domain.

## Pages

| Route | Description |
|---|---|
| `/` | Home |
| `/login` | Sign in |
| `/register` | Sign up |
| `/inventory` | Inventory list |
| `/inventory/[id]` | Overview & sell |
| `/inventory/[id]/manage` | Edit items & price variables |
| `/inventory/[id]/history` | Sales history |
| `/inventory/[id]/analytics` | Analytics dashboard |

## Production notes

- `NEXT_PUBLIC_API_URL` is build-time baked into the frontend image.
- If you change `NEXT_PUBLIC_API_URL`, rebuild/redeploy frontend image.
- Use `https://...` values in production to avoid mixed-content browser blocking.

## Troubleshooting quick hits

- **Mixed Content blocked**: public URL is `http://...` while site is `https://...`.
- **Auth `401` on `/api/backend/*`**: verify login/session requests hit `/api/backend/api/auth/*` and backend is healthy.
- **Chunk `503` during deploy**: often rollout/cache mismatch; hard refresh once after rollout and keep at least 2 frontend replicas.

For full deployment and architecture docs, see [root README](../README.md).
