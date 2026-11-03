# Data Model

Schema: `back-end/repository/prisma/schema.prisma`, provider `mysql` (MariaDB).

```
users 1--* sessions
users 1--* accounts
users 1--* inventory_users *--1 inventorys 1--* items 1--* price_variables
                                                  items 1--* sold_items
verifications (standalone, Better Auth)
```

| Table | Key columns | Notes |
|---|---|---|
| users | id (cuid), email unique, role default `user`, age | Better Auth user |
| sessions | token unique, expiresAt, ipAddress, userAgent | cascade on user delete |
| accounts | providerId + accountId unique, password (hash) | credentials live here |
| verifications | identifier + value unique | unused while verification is off |
| inventorys | id, name, description | |
| inventory_users | userId + inventoryId unique, role default `viewer` | indexed both ways, cascade |
| items | buyPrice Decimal(10,2), quantity, inventoryId (nullable), website* fields, memberPrice, nonMemberPrice | indexes on inventoryId and publishedToWebsite |
| price_variables | name + itemId unique, type PERCENTAGE or FIXED, isDefault | cascade on item delete |
| sold_items | finalSellPrice Decimal(10,2), quantity, priceVariableName, isCustomPrice, `payedCash` column | indexes on itemId, soldAt, (itemId, soldAt), priceVariableName |

## Quirks to know

- `SoldItem.paidCash` maps to the legacy DB column `payedCash` (`@map`). Raw SQL must use `payedCash`.
- `Item.inventoryId` is nullable and has no `onDelete` cascade. Deleting an inventory with items is rejected or leaves orphans depending on DB constraints (VERIFY in `inventory.db`).
- Sale rows cascade-delete with their item, so deleting an item erases its sales history and distorts analytics.
- Roles are plain strings, not DB enums. Validation is in Zod only.
- Money is Decimal(10,2) in DB but numeric in JSON.

## Migrations

The back-end image contains `repository/prisma` but its `CMD` is only `node dist/app.js`, and no manifest runs `prisma migrate deploy`. Schema changes must be applied explicitly (see [deployment-kubernetes.md](deployment-kubernetes.md#database-migrations)).
