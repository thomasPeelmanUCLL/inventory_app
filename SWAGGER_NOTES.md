# Swagger Alignment Notes

This project uses Zod for runtime validation and Swagger (OpenAPI) for API documentation. To avoid confusion and drift, keep in mind:

## Decimal fields
- Monetary fields (e.g., Item.buyPrice, SoldItem.finalSellPrice) are stored as Decimal in Prisma.
- Clients may send values as numbers or strings. Prefer strings to avoid floating-point rounding.
- Swagger schemas can indicate `type: string`, `format: decimal` for clarity, even if server accepts numbers.

## Authentication cookies
- Better Auth typically sets a cookie named `better-auth.session_token`.
- In Swagger, the cookie security scheme is declared as:

```yaml
components:
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: better-auth.session_token
```

## Authorization
- All non-auth endpoints require an authenticated session.
- Authorization is multi-tenant: users can only access inventories they belong to.

## Validation vs Docs
- Zod is the source of truth. When making changes to validation rules, update Swagger descriptions to match (min/max, required, formats).
- Prefer short descriptions in Swagger that match Zod error messages to help clients.

## Recommended improvement
- Consider generating OpenAPI from Zod schemas (e.g., zod-to-openapi) in a future iteration to eliminate drift.
