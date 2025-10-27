/*
  Warnings:

  - You are about to drop the column `price` on the `items` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `sold_items` table. All the data in the column will be lost.
  - You are about to drop the column `sellingPrice` on the `sold_items` table. All the data in the column will be lost.
  - Added the required column `buyPrice` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `items` table without a default value. This is not possible if the table is not empty.
  - Added the required column `finalSellPrice` to the `sold_items` table without a default value. This is not possible if the table is not empty.
  - Made the column `soldAt` on table `sold_items` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "sold_items" DROP CONSTRAINT "sold_items_itemId_fkey";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "price",
ADD COLUMN     "buyPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "priceVariableId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "sold_items" DROP COLUMN "createdAt",
DROP COLUMN "sellingPrice",
ADD COLUMN     "finalSellPrice" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "isCustomPrice" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "priceVariableName" TEXT,
ALTER COLUMN "soldAt" SET NOT NULL,
ALTER COLUMN "soldAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "price_variables" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "inventoryId" INTEGER NOT NULL,

    CONSTRAINT "price_variables_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "price_variables_name_inventoryId_key" ON "price_variables"("name", "inventoryId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_priceVariableId_fkey" FOREIGN KEY ("priceVariableId") REFERENCES "price_variables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sold_items" ADD CONSTRAINT "sold_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
