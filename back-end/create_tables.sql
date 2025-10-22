-- Create tables for inventory application

-- Create the inventorys table
CREATE TABLE IF NOT EXISTS "public"."inventorys" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL
);

-- Create the items table
CREATE TABLE IF NOT EXISTS "public"."items" (
  "id" SERIAL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "buyedAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "inventoryId" INTEGER,
  CONSTRAINT "items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "public"."inventorys" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create the sold_items table
CREATE TABLE IF NOT EXISTS "public"."sold_items" (
  "id" SERIAL PRIMARY KEY,
  "itemId" INTEGER NOT NULL,
  "sellingPrice" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  "payedCash" BOOLEAN NOT NULL DEFAULT false,
  "soldAt" TIMESTAMP,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "sold_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "public"."items" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create the users table
CREATE TABLE IF NOT EXISTS "public"."users" (
  "id" SERIAL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "age" INTEGER NOT NULL
);