/*
  Warnings:

  - You are about to drop the column `priceVariableId` on the `items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_priceVariableId_fkey";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "priceVariableId";

-- AddForeignKey
ALTER TABLE "price_variables" ADD CONSTRAINT "price_variables_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
