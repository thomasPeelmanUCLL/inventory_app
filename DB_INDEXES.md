# Database Index Recommendations

To ensure good performance at scale, add the following indexes in Prisma schema and run a migration.

## Items
- Index: item.inventoryId
  - Speeds up: listing items per inventory, bulk queries across inventories.

## SoldItems
- Index: soldItem.itemId
  - Speeds up: item-level sales history.
- Index: soldItem.soldAt
  - Speeds up: date-range analytics.
- Composite Index: soldItem(itemId, soldAt)
  - Speeds up: item sales analytics over time.
- Composite Index: soldItem(finalSellPrice, soldAt) [optional]
  - Speeds up: pricing analytics by time.

## InventoryUser
- Unique Composite: inventoryUser(userId, inventoryId) (should already exist)
- Index: inventoryUser.userId
  - Speeds up: listing inventories for a user.

## Prisma Schema Example (schema.prisma)

```prisma
model Item {
  id           Int           @id @default(autoincrement())
  name         String
  description  String
  buyPrice     Decimal
  quantity     Int
  buyedAt      DateTime?
  inventoryId  Int
  SoldItem     SoldItem[]

  @@index([inventoryId], name: "idx_item_inventoryId")
}

model SoldItem {
  id               Int      @id @default(autoincrement())
  itemId           Int
  finalSellPrice   Decimal
  priceVariableName String?
  isCustomPrice    Boolean   @default(false)
  payedCash        Boolean   @default(false)
  quantity         Int
  soldAt           DateTime  @default(now())
  item             Item      @relation(fields: [itemId], references: [id])

  @@index([itemId], name: "idx_soldItem_itemId")
  @@index([soldAt], name: "idx_soldItem_soldAt")
  @@index([itemId, soldAt], name: "idx_soldItem_itemId_soldAt")
}

model InventoryUser {
  userId      String
  inventoryId Int
  role        String

  @@id([userId, inventoryId])
  @@index([userId], name: "idx_inventoryUser_userId")
}
```

After updating schema.prisma:

```bash
npx prisma generate
npx prisma migrate dev -n add_performance_indexes
```
