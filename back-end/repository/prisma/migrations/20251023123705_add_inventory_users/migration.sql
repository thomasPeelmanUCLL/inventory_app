-- CreateTable
CREATE TABLE "inventory_users" (
                                   "id" SERIAL NOT NULL,
                                   "userId" TEXT NOT NULL,
                                   "inventoryId" INTEGER NOT NULL,
                                   "role" TEXT NOT NULL DEFAULT 'viewer',
                                   "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                   CONSTRAINT "inventory_users_pkey" PRIMARY KEY ("id")
);

-- AlterTable
-- Add updatedAt column with default value for existing rows
ALTER TABLE "inventorys" ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "inventorys" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "inventory_users_userId_inventoryId_key" ON "inventory_users"("userId", "inventoryId");

-- AddForeignKey
ALTER TABLE "inventory_users" ADD CONSTRAINT "inventory_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_users" ADD CONSTRAINT "inventory_users_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventorys"("id") ON DELETE CASCADE ON UPDATE CASCADE;
