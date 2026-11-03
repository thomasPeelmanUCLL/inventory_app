# Security

## Trust boundaries

1. Internet to ingress-nginx (TLS terminated at ingress).
2. Ingress to front-end and `/api/auth` on back-end.
3. Front-end pod to back-end Service (cluster network).
4. Back-end to MariaDB (cluster network, password auth).
5. Other namespaces (`iswleuven`) to back-end (token auth).

## Controls in place

| Layer | Control |
|---|---|
| Ingress | Only `/`, `/api/backend`, `/api/auth` are exposed. Raw business routes such as `/items` are not routed from outside |
| NetworkPolicy `allow-food-api-to-inventory-backend` | Back-end accepts TCP 3000 only from: pods `app=frontend`, namespace `ingress-nginx`, and pod `app=food-api` in namespace `iswleuven` |
| Authentication | Better Auth, scrypt-hashed passwords in `accounts`, signed session cookie, 7 day sessions |
| Authorization | Per-inventory RBAC (`access.service.ts`) on every data route; moves between inventories need write on both |
| Input validation | Zod on params, query and body; money limited to 2 decimals |
| CORS | Production allows only `FRONTEND_URL`, credentials on |
| Headers | Helmet with CSP, HSTS 1 year, includeSubDomains, preload |
| Rate limiting | See api-reference |
| Machine auth | `X-Integration-Token`, hashed compare in constant time |
| Container | Multi-stage, non-root `appuser`, prod deps only |
| Startup guard | In production the app exits if FRONTEND_URL, BACKEND_URL, DATABASE_URL or BETTER_AUTH_SECRET is missing or the URLs are invalid |
| Resources | CPU/memory requests and limits on all pods |

## Secrets inventory

| Secret | Keys | Consumer |
|---|---|---|
| `postgres-secret` | POSTGRES_PASSWORD | MariaDB (user and root), wait-for-db init container |
| `inventory-backend-secret` | DATABASE_URL, BETTER_AUTH_SECRET, FRONTEND_URL, BACKEND_URL | back-end |
| `inventory-integration-token` | token | back-end `INTEGRATION_TOKEN` |
| GitHub Actions | NEXT_PUBLIC_API_URL | front-end image build arg |

No Secret manifests are committed (correct). Create them out of band or with a sealed/external secret tool.

## Findings and recommendations

| ID | Severity | Finding | Fix |
|---|---|---|---|
| S-1 | High | MariaDB root password equals the app user password | Separate `MARIADB_ROOT_PASSWORD` secret |
| S-2 | High | No NetworkPolicy selects the MariaDB pod, so any pod in the cluster can reach 3306 | Add ingress policy allowing only `app=backend` |
| S-3 | Medium | `GET /users` lets any signed-in user enumerate every user's email | Restrict to admin or scope to shared inventories |
| S-4 | Medium | Email verification disabled, open sign-up | Enable verification or invite-only sign-up |
| S-5 | Medium | `trust proxy` is 1 while traffic passes ingress then Next.js then back-end, IP-based rate limits may key on the wrong hop | Verify real client IP, adjust hop count |
| S-6 | Medium | Back-end CSP/Helmet only protects API; the Next.js front-end sets its own headers (VERIFY `next.config.mjs`) | Add headers in Next.js |
| S-7 | Low | Images pinned by tag `sha-...` not digest, `latest` also pushed | Pin by digest; Image Updater already uses digest strategy |
| S-8 | Low | No pod `securityContext` (runAsNonRoot, readOnlyRootFilesystem, drop ALL caps) in manifests | Add to Deployments |
| S-9 | Low | Single-replica MariaDB with no backup job | See operations.md |
| S-10 | Low | `NODE_ENV` is non-production locally so CORS allows localhost origins | Expected |
| S-11 | Info | Swagger UI at `/api-docs` is unauthenticated and loads CSS from cdnjs, conflicting with the strict CSP `styleSrc` | Disable in production or self-host CSS |

## Incident quick actions

- Rotate session secret: change `BETTER_AUTH_SECRET`, restart back-end. All sessions are invalidated.
- Revoke integration access: rotate `inventory-integration-token`, restart back-end, update food-api.
- Compromised user: delete rows in `sessions` for that user; remove from `inventory_users`.
