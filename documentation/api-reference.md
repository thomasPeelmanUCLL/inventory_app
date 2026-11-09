# API Reference

Base URL (in-cluster): `http://inventory-backend.inventory.svc.cluster.local`. Local: `http://localhost:3000`. Through the browser: `/api/backend/<path>` (rewritten) and `/api/auth/*`.

Interactive Swagger UI: `GET /api-docs` (generated from JSDoc; coverage is partial, this document is authoritative).

## Authentication

Every business route runs `requireAuth`. Session is a Better Auth cookie (`better-auth.session_token`, 7 day expiry, refreshed daily). A bearer session token is declared in the OpenAPI spec as well. Unauthenticated calls return 401.

Better Auth endpoints live under `/api/auth/*` (for example `POST /api/auth/sign-up/email`, `POST /api/auth/sign-in/email`, `POST /api/auth/sign-out`, `GET /api/auth/get-session`). Email verification is **disabled**. See the Better Auth docs for the full list.

## Roles

| Level | Allowed roles | Used for |
|---|---|---|
| read | viewer, editor, owner | GET on inventory data |
| write | editor, owner | create/update/delete items, sales, price variables |
| owner | owner | manage members, delete inventory |

A missing membership returns 403 (`Access denied to this inventory`). Unknown item returns 404.

## Operational endpoints (no auth)

| Method | Path | Description |
|---|---|---|
| GET | `/` | Service banner with links |
| GET | `/health` | 200 `OK` or 503 `DEGRADED` with DB latency. Used by liveness and readiness probes |
| GET | `/ready` | Readiness detail: DB, environment, services, uptime, heap memory |
| GET | `/api-docs` | Swagger UI |

## Inventories `/inventorys`

| Method | Path | Role | Body | Response |
|---|---|---|---|---|
| GET | `/my` | member | none | Inventories of caller |
| GET | `/:id` | member (checked in service) | none | Inventory |
| POST | `/` | any user | `{name (1-255), description (max 1000, default "")}` | 201 Inventory, caller becomes owner |
| PUT | `/:id` | per service | partial of POST body | Inventory |
| DELETE | `/:id` | owner | none | 204 |
| GET | `/:id/users` | member | none | Members |
| POST | `/:id/users` | owner | `{email or userId, role: owner/editor/viewer}` | 201 `{message}` |
| DELETE | `/:id/users/:userId` | owner | none | 204 |

## Items `/items`

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | member | Items of all inventories the caller belongs to |
| GET | `/inventory/:inventoryId` | read | |
| GET | `/:id` | read | |
| POST | `/` | write on `inventoryId` if given | 201 |
| PUT | `/:id` | write; also write on destination if `inventoryId` changes | partial update, `priceVariables` not accepted |
| DELETE | `/:id` | write | 204 |

Item body:

| Field | Type | Rules |
|---|---|---|
| name | string | 1-255, required |
| description | string | max 1000 |
| buyPrice | number | >= 0, required |
| quantity | int | >= 0, required |
| buyedAt | date | optional |
| inventoryId | int | optional |
| websiteCategory, websiteEmoji | string or null | blank becomes null |
| websiteSortOrder | int | optional |
| memberPrice, nonMemberPrice | money or null | >= 0, max 2 decimals |
| publishedToWebsite | bool | true requires websiteCategory, memberPrice, nonMemberPrice |
| priceVariables | array | create only: `{name, value, type, isDefault}` |

## Sold items `/soldItems`

Route order matters: static paths are declared before `/:id`.

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/` | member | Sales across member inventories |
| GET | `/inventory/:inventoryId` | read | |
| GET | `/inventory/:inventoryId/analytics?startDate&endDate` | read | 400 if start is after end |
| GET | `/item/:itemId` | read | |
| GET | `/:id` | read | |
| POST | `/` | write on item | 201 |
| PUT | `/:id` | write | partial, `itemId` immutable |
| DELETE | `/:id` | write | 204, this is the revert |

Sale body: `itemId` (int), `finalSellPrice` (>0), `quantity` (int >0), `priceVariableName?`, `isCustomPrice` (default false), `paidCash` (default false), `soldAt?`. Legacy keys `payedCash` and `paidWithCash` are accepted and normalised to `paidCash`.

## Price variables `/priceVariables`

| Method | Path | Notes |
|---|---|---|
| GET | `/item/:itemId` | list for item |
| GET | `/:id` | single |
| POST | `/` | `{name, value >= 0, type PERCENTAGE or FIXED, isDefault?, itemId}` returns 201 |
| PUT | `/:id` | partial |
| DELETE | `/:id` | 204 |

Authorization is enforced in `priceVariable.service` against the item's inventory. Name is unique per item.

## Users `/users`

| Method | Path | Notes |
|---|---|---|
| GET | `/` | all users, or `?email=` for one |
| GET | `/name/:name` | by name |
| GET | `/:id` | by id |

Any signed-in user can list all users (names, emails). See [security.md](security.md) finding S-3.

## Integration `/integrations`

`GET /integrations/iswleuven/catalogue`

- Auth: header `X-Integration-Token` compared to env `INTEGRATION_TOKEN` (SHA-256 then `timingSafeEqual`). Wrong or missing returns 401 `{error}`.
- Source: inventory `WEBSITE_INVENTORY_ID` (currently `1`), only items with `publishedToWebsite` and category and both prices set. Missing or invalid ID returns 500.
- Response: array of categories `{id, title, emoji, items:[{id, name, priceNonMember, priceMember, amount, available}]}`. Prices are integer cents. `Cache-Control: no-store`.

## Validation errors

Zod failures return HTTP 400 via `formatZodError`. Malformed JSON returns 400 `{error:"Invalid JSON format", message, requestId, timestamp}`. Unknown routes hit `notFoundHandler`. Each response carries `X-Request-ID`.

## Rate limits (per IP, express-rate-limit)

| Scope | Limit |
|---|---|
| `/api/auth/*` | 100 per 15 min |
| `/api/auth/sign-in/*` | 10 per 15 min |
| Business GET/HEAD | 120 per min |
| Business writes | 30 per min |

Body limit 10 MB. `trust proxy` is 1, so the client IP comes from the first proxy hop. Behind the Next.js rewrite, all browser traffic may share the front-end pod IP, which makes the per-IP limits effectively global for business routes (VERIFY forwarded headers).

## Examples

```bash
# sign in and keep the cookie
curl -c jar -H 'Content-Type: application/json' \
  -d '{"email":"me@example.com","password":"..."}' \
  https://inventory.iswleuven.be/api/auth/sign-in/email

# list my inventories
curl -b jar https://inventory.iswleuven.be/api/backend/inventorys/my

# analytics for a range
curl -b jar 'https://inventory.iswleuven.be/api/backend/soldItems/inventory/1/analytics?startDate=2026-01-01&endDate=2026-03-31'

# integration catalogue (in-cluster)
curl -H "X-Integration-Token: $TOKEN" http://inventory-backend.inventory.svc.cluster.local/integrations/iswleuven/catalogue
```
