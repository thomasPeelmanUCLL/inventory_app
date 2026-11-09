# Architecture

## Components

| Component | Tech | Port | K8s object |
|---|---|---|---|
| Front-end | Next.js (Pages Router), TypeScript, Tailwind | 3000 in cluster, 8080 local | Deployment `inventory-frontend`, Service `inventory-frontend` (80) |
| Back-end | Node 20, Express, Prisma, Better Auth, Zod | 3000 | Deployment `inventory-backend`, Service `inventory-backend` (80) |
| Database | MariaDB 11 | 3306 | Deployment `postgres`, Service `postgres`, PVC `postgres-pvc` (5Gi) |
| Ingress | ingress-nginx | 80/443 | Ingress `inventory-ingress` |
| GitOps | Argo CD + Image Updater | n/a | Application `inventory-app` (ns `argocd`) |

## Request flow

```
Browser
  |  https://inventory.iswleuven.be
  v
ingress-nginx
  |-- /api/auth    --> inventory-backend:80 --> pod :3000   (Better Auth)
  |-- /api/backend --> inventory-frontend:80 (Next.js rewrite)
  |-- /           --> inventory-frontend:80
                          |  rewrite /api/backend/* -> INTERNAL_API_URL
                          v
                    inventory-backend.inventory.svc.cluster.local
                          v
                    postgres.inventory.svc.cluster.local:3306 (MariaDB)
```

The browser only talks to one origin. Business API calls (`/inventorys`, `/items`, ...) reach the back-end solely through the Next.js server-side rewrite, pod to pod. Only `/api/auth` is routed by the ingress straight to the back-end.

A second consumer, the ISWLeuven `food-api` (namespace `iswleuven`), calls `GET /integrations/iswleuven/catalogue` pod to pod using a shared token.

## Back-end layering

```
controller/*.routes.ts   HTTP, validation (Zod), authz calls
service/*.service.ts     business logic, access.service.ts = RBAC
repository/*.db.ts       Prisma queries
model/ dto/              domain classes, response shapes
middleware/              auth, error handling
util/                    validators.ts, ops.ts (health), errors
lib/auth.ts              Better Auth instance
```

## Domain behaviour

- An Inventory holds Items. Users join inventories through InventoryUser with a role (owner, editor, viewer).
- An Item has buyPrice, quantity and optional PriceVariables (FIXED amount or PERCENTAGE markup, one may be default).
- Selling creates a SoldItem snapshot (finalSellPrice, quantity, payment method, price variable name, custom price flag). Sales can be edited or deleted (revert).
- Analytics aggregate SoldItems per inventory (profit, revenue, top sellers, sales by day, payment split) with optional date range; the UI exports to Excel (SheetJS).
- Items can be published to a website catalogue (category, emoji, sort order, member/non-member price) which the integration endpoint serves.

## Repository map

```
argocd/application.yaml   Argo CD Application (path k8s, auto sync, selfHeal, no prune)
back-end/                 API + Dockerfile (multi-stage, non-root)
front-end/                Next.js app + Dockerfile
k8s/                      all manifests Argo CD syncs
.github/workflows/        ci.yml, deploy.yml (build and push images)
documentation/            this folder
```
