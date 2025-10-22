-- CreateTable
CREATE TABLE "sold_items" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "sellingPrice" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sold_items_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sold_items" ADD CONSTRAINT "sold_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
