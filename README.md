[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/twPj_hbU)

# Inventory Management App

A full-stack inventory management system for tracking items, recording sales, and analysing revenue. Built with Next.js on the front-end and a Node.js/Express back-end, backed by a PostgreSQL database.

### Thomas Peelman

---

## Features

- **Inventories** — create and manage multiple inventories, each with its own set of items
- **Items** — add items with a buy price and quantity; track stock levels in real time
- **Selling** — sell items individually or via a shopping cart; supports cash and card payments
- **Price variables** — define named price presets (fixed or percentage markup) per item
- **Sales history** — view and revert past transactions
- **Analytics** — profit, revenue, top-selling items, sales by day, and payment method breakdown; exportable to Excel
- **Multi-user** — invite users to inventories with owner / editor / viewer roles
- **Authentication** — email/password sign-up and login via Better Auth

---

## Tech Stack

| Layer | Technology |
|---|---|
| Front-end | Next.js (Pages Router), TypeScript, Tailwind CSS |
| Back-end | Node.js, Express, Prisma ORM |
| Database | PostgreSQL |
| Auth | Better Auth |
| Export | SheetJS (xlsx) |
| Containerisation | Docker / Docker Compose |
| CI/CD | GitHub Actions, GHCR, Kubernetes |

---

## Project Structure

```
inventory_app/
├── front-end/
│   ├── components/
│   │   ├── analytics/       # SummaryCards, TopSellingTable, SalesByDayTable, …
│   │   ├── auth/            # LoginForm, RegisterForm
│   │   ├── common/          # LoadingScreen, ErrorScreen
│   │   ├── history/         # HistoryStatsCards, SalesHistoryTable
│   │   ├── home/            # HomePageInformation
│   │   ├── inventory/       # InventoryCard, SellModal, CartSidebar, …
│   │   └── layout/          # Header
│   ├── lib/
│   │   ├── api.ts           # All API calls
│   │   └── auth-client.ts   # Better Auth client
│   ├── pages/
│   │   ├── index.tsx
│   │   ├── Login/
│   │   ├── Register/
│   │   └── Inventory/
│   │       ├── index.tsx         # Inventory list
│   │       └── [id]/
│   │           ├── index.tsx     # Overview & sell
│   │           ├── manage.tsx    # Edit items & price variables
│   │           ├── history.tsx   # Sales history
│   │           └── analytics.tsx # Analytics dashboard
│   └── types/
└── back-end/
    ├── controller/          # Express routers (*.routes.ts)
    ├── service/             # Business logic (*.service.ts)
    ├── repository/          # Prisma DB access (*.db.ts)
    ├── model/               # Domain classes
    ├── dto/                 # Response shapes (*.dto.ts)
    ├── middleware/          # auth, authorization, error handling
    ├── lib/
    │   └── auth.ts          # Better Auth instance
    └── repository/prisma/
        └── schema.prisma
```

---

## Getting Started

### With Docker Compose (recommended)

```bash
docker compose up --build
```

This starts the front-end, back-end, and a PostgreSQL database together.

### Without Docker

**Back-end**
```bash
cd back-end
npm install
npx prisma migrate dev
npm run dev
```

**Front-end**
```bash
cd front-end
npm install
npm run dev
```

The front-end runs on `http://localhost:8080` and expects the back-end on `http://localhost:3000` by default.

---

## Environment Variables

**`front-end/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**`back-end/.env`**
```env
DATABASE_URL=postgresql://user:password@localhost:5432/inventory
BETTER_AUTH_SECRET=your-secret-here
FRONTEND_URL=http://localhost:8080
BACKEND_URL=http://localhost:3000
```

> In production the `DATABASE_URL` is constructed automatically by the deploy workflow from `POSTGRES_PASSWORD` and points to the in-cluster PostgreSQL service.

---

## CI/CD

Two GitHub Actions workflows run on every push to `main`:

| Workflow | What it does |
|---|---|
| `ci.yml` | Type-check, lint, build (frontend + backend); runs Prisma migrations against a test Postgres container |
| `deploy.yml` | Repeats CI checks, builds and pushes Docker images to GHCR, then deploys to Kubernetes |

The deploy workflow handles full cluster bootstrapping on every run — it creates/updates all Kubernetes secrets before applying manifests, so no manual `kubectl` setup is needed on a fresh cluster.

### Required GitHub Secrets

| Secret | Description |
|---|---|
| `POSTGRES_PASSWORD` | Password for the in-cluster PostgreSQL database |
| `BETTER_AUTH_SECRET` | Secret key for Better Auth session signing |
| `FRONTEND_URL` | Production front-end URL (e.g. `https://inventory.thomaspeelman.be`) |
| `BACKEND_URL` | Production back-end URL (e.g. `https://api.thomaspeelman.be`) |
| `NEXT_PUBLIC_API_URL` | Same as `BACKEND_URL`, injected at Docker build time |
| `KUBECONFIG` | Base64-encoded kubeconfig for the production cluster |
| `K8S_API_SERVER` | Kubernetes API server URL |

> `DATABASE_URL` is **not** a required secret — it is assembled automatically as
> `postgresql://inventory:<POSTGRES_PASSWORD>@postgres.inventory.svc.cluster.local:5432/inventory`.

---

## Production Deployment Checklist

Before the first deploy to a fresh cluster, complete the following steps:

- [ ] Add all 7 GitHub Actions secrets listed above (`Settings → Secrets and variables → Actions`)
- [ ] Update the domain in `k8s/ingress.yml` to match your `FRONTEND_URL` and `BACKEND_URL` secrets
- [ ] Ensure your Traefik ingress controller is running in the cluster with a `cloudflare` cert resolver configured
- [ ] Ensure your kubeconfig points to the real cluster API server (not localhost)
- [ ] Push to `main` — the workflow will create all secrets, apply manifests, run migrations, and roll out both deployments automatically
- [ ] Remove `.idea/` from git tracking: `git rm -r --cached .idea && git commit -m "chore: untrack .idea"`
