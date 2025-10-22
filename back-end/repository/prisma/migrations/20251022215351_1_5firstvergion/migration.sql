-- AlterTable
ALTER TABLE "items" ADD COLUMN     "inventoryId" INTEGER;

-- AlterTable
ALTER TABLE "sold_items" ALTER COLUMN "soldAt" DROP NOT NULL,
ALTER COLUMN "soldAt" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventorys"("id") ON DELETE SET NULL ON UPDATE CASCADE;
