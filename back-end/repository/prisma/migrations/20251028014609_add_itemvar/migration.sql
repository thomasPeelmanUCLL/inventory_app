/*
  Warnings:

  - You are about to drop the column `inventoryId` on the `price_variables` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,itemId]` on the table `price_variables` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `itemId` to the `price_variables` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "price_variables_name_inventoryId_key";

-- AlterTable
ALTER TABLE "price_variables" DROP COLUMN "inventoryId",
ADD COLUMN     "itemId" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "price_variables_name_itemId_key" ON "price_variables"("name", "itemId");
