-- CreateIndex
CREATE INDEX "idx_item_inventoryId" ON "items"("inventoryId");

-- CreateIndex
CREATE INDEX "idx_soldItem_itemId" ON "sold_items"("itemId");

-- CreateIndex
CREATE INDEX "idx_soldItem_soldAt" ON "sold_items"("soldAt");

-- CreateIndex
CREATE INDEX "idx_soldItem_itemId_soldAt" ON "sold_items"("itemId", "soldAt");

-- CreateIndex
CREATE INDEX "idx_inventoryUser_userId" ON "inventory_users"("userId");
