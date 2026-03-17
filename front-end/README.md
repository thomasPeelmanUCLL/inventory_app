# Front-end

Next.js (Pages Router) front-end with TypeScript, Tailwind CSS, and Better Auth.

## Prerequisites

- Node.js 20+
- Back-end running on `http://localhost:3000` (or use Docker Compose from the root)

## Setup

```bash
npm install
```

Create a `.env.local` file in this folder:

```env
# Public URL for Better Auth — browser uses this directly for sign-in/sign-up
NEXT_PUBLIC_API_URL=http://localhost:3000

# Internal URL for Next.js rewrites — server-side only, never sent to the browser
# In Kubernetes this is set via frontend-configmap.yml (ClusterIP service DNS)
INTERNAL_API_URL=http://localhost:3000
```

Start the development server:

```bash
npm run dev
```

The app runs on `http://localhost:8080`.

## How API calls work

All API calls go through `/api/backend/*` which Next.js rewrites to `INTERNAL_API_URL` (see `next.config.mjs`). This means:
- In **development**: rewrites to `http://localhost:3000` directly
- In **production (Kubernetes)**: rewrites to the backend ClusterIP service — pod-to-pod, never public

Better Auth (`auth-client.ts`) is the only code that uses `NEXT_PUBLIC_API_URL` and talks directly to the public backend URL. This is required because Better Auth sets HTTP-only cookies that must come from the real origin.

## Pages

| Route | Description |
|---|---|
| `/` | Home |
| `/Login` | Sign in |
| `/Register` | Sign up |
| `/Inventory` | Inventory list |
| `/Inventory/[id]` | Overview & sell |
| `/Inventory/[id]/manage` | Edit items & price variables |
| `/Inventory/[id]/history` | Sales history |
| `/Inventory/[id]/analytics` | Analytics dashboard |

> For full setup, deployment, and architecture documentation see the [root README](../README.md).
