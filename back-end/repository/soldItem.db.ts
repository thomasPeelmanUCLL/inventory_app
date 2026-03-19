import { SoldItem } from '../model/soldItem';
import { SoldItem as SoldItemPrisma, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import database from './database';

class SoldItemRepository extends BaseRepository<SoldItem, SoldItemPrisma> {
    protected entityName = 'soldItem';

    protected fromPrisma(prismaEntity: SoldItemPrisma): SoldItem {
        return SoldItem.from(prismaEntity);
    }

    protected getEntityId(entity: SoldItem): number {
        return entity.getId();
    }

    async getAllSoldItems(): Promise<SoldItem[]> {
        return this.findMany({ include: { item: true }, orderBy: { soldAt: 'desc' } });
    }

    async getSoldItemById({ id }: { id: number }): Promise<SoldItem | null> {
        return this.findUnique({ where: { id }, include: { item: true } });
    }

    async getSoldItemsByItemId({ itemId }: { itemId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { itemId },
            include: { item: true },
            orderBy: { soldAt: 'desc' },
        });
    }

    async getSoldItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { item: { inventoryId } },
            include: { item: true },
            orderBy: { soldAt: 'desc' },
        });
    }

    async getSoldItemsByInventoryIds({
        inventoryIds,
    }: {
        inventoryIds: number[];
    }): Promise<SoldItem[]> {
        if (!inventoryIds.length) return [];
        return this.findMany({
            where: { item: { inventoryId: { in: inventoryIds } } },
            include: { item: true },
            orderBy: [{ item: { inventoryId: 'asc' } }, { soldAt: 'desc' }],
        });
    }

    async createSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            itemId: soldItem.getItemId(),
            finalSellPrice: soldItem.getFinalSellPrice(),
            priceVariableName: soldItem.getPriceVariableName(),
            isCustomPrice: soldItem.getIsCustomPrice(),
            paidCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        return this.create(data, { include: { item: true } });
    }

    async updateSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            finalSellPrice: soldItem.getFinalSellPrice(),
            priceVariableName: soldItem.getPriceVariableName(),
            isCustomPrice: soldItem.getIsCustomPrice(),
            paidCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        const result = await this.update(soldItem, data, { include: { item: true } });
        if (!result) throw new Error(`Failed to update sold item with ID: ${soldItem.getId()}`);
        return result;
    }

    async deleteSoldItem({ id }: { id: number }): Promise<void> {
        return this.delete(id);
    }

    async createSoldItemWithStockUpdate(input: {
        itemId: number;
        finalSellPrice: Prisma.Decimal | number;
        priceVariableName?: string | null;
        isCustomPrice?: boolean;
        paidCash?: boolean;
        quantity: number;
        soldAt?: Date;
    }): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            const item = await tx.item.findUnique({
                where: { id: input.itemId },
                select: { id: true, quantity: true, name: true },
            });
            if (!item) throw new Error('Item not found');
            if (item.quantity < input.quantity)
                throw new Error(
                    `Not enough stock available for ${item.name}. Available: ${item.quantity}, Requested: ${input.quantity}`,
                );
            await tx.item.update({
                where: { id: item.id },
                data: { quantity: { decrement: input.quantity } },
            });
            const created = await tx.soldItem.create({
                data: {
                    itemId: input.itemId,
                    finalSellPrice: input.finalSellPrice,
                    quantity: input.quantity,
                    priceVariableName: input.priceVariableName ?? null,
                    isCustomPrice: !!input.isCustomPrice,
                    paidCash: !!input.paidCash,
                    soldAt: input.soldAt ?? new Date(),
                },
                include: { item: true },
            });
            return created;
        });
    }

    async updateSoldItemWithStockAdjustment(
        id: number,
        patch: {
            finalSellPrice?: number | Prisma.Decimal;
            priceVariableName?: string | null;
            isCustomPrice?: boolean;
            paidCash?: boolean;
            quantity?: number;
            soldAt?: Date;
        },
    ): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            const existing = await tx.soldItem.findUnique({
                where: { id },
                include: { item: true },
            });
            if (!existing) throw new Error('Sold item not found');
            let delta = 0;
            if (typeof patch.quantity === 'number' && patch.quantity !== existing.quantity) {
                if (patch.quantity <= 0) throw new Error('Quantity must be positive');
                delta = existing.quantity - patch.quantity;
                if (delta < 0) {
                    const it = await tx.item.findUnique({
                        where: { id: existing.itemId },
                        select: { quantity: true, name: true },
                    });
                    if (!it || it.quantity < Math.abs(delta))
                        throw new Error(
                            `Not enough stock available for ${it?.name || 'item'}. Available: ${it?.quantity || 0}, Additional needed: ${Math.abs(delta)}`,
                        );
                }
            }
            if (delta !== 0) {
                if (delta > 0)
                    await tx.item.update({
                        where: { id: existing.itemId },
                        data: { quantity: { increment: delta } },
                    });
                else
                    await tx.item.update({
                        where: { id: existing.itemId },
                        data: { quantity: { decrement: Math.abs(delta) } },
                    });
            }
            const updated = await tx.soldItem.update({
                where: { id },
                data: {
                    finalSellPrice: patch.finalSellPrice ?? existing.finalSellPrice,
                    priceVariableName: patch.priceVariableName ?? existing.priceVariableName,
                    isCustomPrice:
                        typeof patch.isCustomPrice === 'boolean'
                            ? patch.isCustomPrice
                            : existing.isCustomPrice,
                    paidCash:
                        typeof patch.paidCash === 'boolean' ? patch.paidCash : existing.paidCash,
                    quantity:
                        typeof patch.quantity === 'number' ? patch.quantity : existing.quantity,
                    soldAt: patch.soldAt ?? existing.soldAt,
                },
                include: { item: true },
            });
            return updated;
        });
    }

    async deleteSoldItemWithStockRestore(id: number): Promise<void> {
        await database.$transaction(async (tx) => {
            const existing = await tx.soldItem.findUnique({
                where: { id },
                select: { itemId: true, quantity: true },
            });
            if (!existing) return;
            await tx.soldItem.delete({ where: { id } });
            await tx.item.update({
                where: { id: existing.itemId },
                data: { quantity: { increment: existing.quantity } },
            });
        });
    }

    // Analytics passthrough (service uses repository client directly previously)
    async getAnalyticsByInventoryId({
        inventoryId,
        startDate,
        endDate,
    }: {
        inventoryId: number;
        startDate?: Date;
        endDate?: Date;
    }) {
        const repo = (await import('../repository/soldItem.db')).default; // avoid circular, placeholder if needed
        // If you already had a direct prisma-based analytics earlier, move it here
        // For now, throw if not implemented in this layer
        throw new Error(
            'getAnalyticsByInventoryId should be implemented in service using prisma directly.',
        );
    }
}

const soldItemRepository = new SoldItemRepository();
export default {
    getAllSoldItems: soldItemRepository.getAllSoldItems.bind(soldItemRepository),
    getSoldItemById: soldItemRepository.getSoldItemById.bind(soldItemRepository),
    getSoldItemsByItemId: soldItemRepository.getSoldItemsByItemId.bind(soldItemRepository),
    getSoldItemsByInventoryId:
        soldItemRepository.getSoldItemsByInventoryId.bind(soldItemRepository),
    getSoldItemsByInventoryIds:
        soldItemRepository.getSoldItemsByInventoryIds.bind(soldItemRepository),
    createSoldItem: soldItemRepository.createSoldItem.bind(soldItemRepository),
    updateSoldItem: soldItemRepository.updateSoldItem.bind(soldItemRepository),
    deleteSoldItem: soldItemRepository.deleteSoldItem.bind(soldItemRepository),
    createSoldItemWithStockUpdate:
        soldItemRepository.createSoldItemWithStockUpdate.bind(soldItemRepository),
    updateSoldItemWithStockAdjustment:
        soldItemRepository.updateSoldItemWithStockAdjustment.bind(soldItemRepository),
    deleteSoldItemWithStockRestore:
        soldItemRepository.deleteSoldItemWithStockRestore.bind(soldItemRepository),
};
