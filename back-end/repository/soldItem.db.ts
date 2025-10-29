import { SoldItem } from '../model/soldItem';
import { SoldItem as SoldItemPrisma, Prisma } from '@prisma/client';
import { BaseRepository } from './base.repository';
import database from "./database";

class SoldItemRepository extends BaseRepository<SoldItem, SoldItemPrisma> {
    protected entityName = 'soldItem';

    protected fromPrisma(prismaEntity: SoldItemPrisma): SoldItem {
        return SoldItem.from(prismaEntity);
    }

    protected getEntityId(entity: SoldItem): number {
        return entity.getId();
    }

    async getAllSoldItems(): Promise<SoldItem[]> {
        return this.findMany({
            include: { item: true },
            orderBy: { soldAt: 'desc' }
        });
    }

    async getSoldItemById({ id }: { id: number }): Promise<SoldItem | null> {
        return this.findUnique({
            where: { id },
            include: { item: true }
        });
    }

    async getSoldItemsByItemId({ itemId }: { itemId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { itemId },
            include: { item: true },
            orderBy: { soldAt: 'desc' }
        });
    }

    async getSoldItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { item: { inventoryId } },
            include: { item: true },
            orderBy: { soldAt: 'desc' }
        });
    }

    async getSoldItemsByInventoryIds({ inventoryIds }: { inventoryIds: number[] }): Promise<SoldItem[]> {
        if (!inventoryIds.length) return [];
        return this.findMany({
            where: { item: { inventoryId: { in: inventoryIds } } },
            include: { item: true },
            orderBy: [
                { item: { inventoryId: 'asc' } },
                { soldAt: 'desc' }
            ]
        });
    }

    async createSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            itemId: soldItem.getItemId(),
            finalSellPrice: soldItem.getFinalSellPrice(),
            priceVariableName: soldItem.getPriceVariableName(),
            isCustomPrice: soldItem.getIsCustomPrice(),
            payedCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        return this.create(data, { include: { item: true } });
    }

    // TRANSACTIONAL: create + stock update
    async createSoldItemWithStockUpdate(input: {
        itemId: number;
        finalSellPrice: Prisma.Decimal | number;
        priceVariableName?: string | null;
        isCustomPrice?: boolean;
        payedCash?: boolean;
        quantity: number;
        soldAt?: Date;
    }): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            const item = await tx.item.findUnique({ where: { id: input.itemId }, select: { id: true, quantity: true, name: true } });
            if (!item) throw new Error('Item not found');
            if (item.quantity < input.quantity) throw new Error(`Not enough stock available for ${item.name}. Available: ${item.quantity}, Requested: ${input.quantity}`);

            await tx.item.update({ where: { id: item.id }, data: { quantity: { decrement: input.quantity } } });

            const created = await tx.soldItem.create({
                data: {
                    itemId: input.itemId,
                    finalSellPrice: input.finalSellPrice,
                    quantity: input.quantity,
                    priceVariableName: input.priceVariableName ?? null,
                    isCustomPrice: !!input.isCustomPrice,
                    payedCash: !!input.payedCash,
                    soldAt: input.soldAt ?? new Date(),
                },
                include: { item: true },
            });
            return created;
        });
    }

    // TRANSACTIONAL: update + stock adjust
    async updateSoldItemWithStockAdjustment(id: number, patch: {
        finalSellPrice?: number | Prisma.Decimal;
        priceVariableName?: string | null;
        isCustomPrice?: boolean;
        payedCash?: boolean;
        quantity?: number;
        soldAt?: Date;
    }): Promise<SoldItemPrisma> {
        return await database.$transaction(async (tx) => {
            const existing = await tx.soldItem.findUnique({ where: { id }, include: { item: true } });
            if (!existing) throw new Error('Sold item not found');

            let delta = 0;
            if (typeof patch.quantity === 'number' && patch.quantity !== existing.quantity) {
                if (patch.quantity <= 0) throw new Error('Quantity must be positive');
                delta = existing.quantity - patch.quantity;
                if (delta < 0) {
                    const it = await tx.item.findUnique({ where: { id: existing.itemId }, select: { quantity: true, name: true } });
                    if (!it || it.quantity < Math.abs(delta)) throw new Error(`Not enough stock available for ${it?.name || 'item'}. Available: ${it?.quantity || 0}, Additional needed: ${Math.abs(delta)}`);
                }
            }

            if (delta !== 0) {
                if (delta > 0) await tx.item.update({ where: { id: existing.itemId }, data: { quantity: { increment: delta } } });
                else await tx.item.update({ where: { id: existing.itemId }, data: { quantity: { decrement: Math.abs(delta) } } });
            }

            const updated = await tx.soldItem.update({
                where: { id },
                data: {
                    finalSellPrice: patch.finalSellPrice ?? existing.finalSellPrice,
                    priceVariableName: patch.priceVariableName ?? existing.priceVariableName,
                    isCustomPrice: typeof patch.isCustomPrice === 'boolean' ? patch.isCustomPrice : existing.isCustomPrice,
                    payedCash: typeof patch.payedCash === 'boolean' ? patch.payedCash : existing.payedCash,
                    quantity: typeof patch.quantity === 'number' ? patch.quantity : existing.quantity,
                    soldAt: patch.soldAt ?? existing.soldAt,
                },
                include: { item: true },
            });

            return updated;
        });
    }

    // TRANSACTIONAL: delete + restore stock
    async deleteSoldItemWithStockRestore(id: number): Promise<void> {
        await database.$transaction(async (tx) => {
            const existing = await tx.soldItem.findUnique({ where: { id }, select: { itemId: true, quantity: true } });
            if (!existing) return; // idempotent
            await tx.soldItem.delete({ where: { id } });
            await tx.item.update({ where: { id: existing.itemId }, data: { quantity: { increment: existing.quantity } } });
        });
    }
}

const soldItemRepository = new SoldItemRepository();
export default {
    getAllSoldItems: soldItemRepository.getAllSoldItems.bind(soldItemRepository),
    getSoldItemById: soldItemRepository.getSoldItemById.bind(soldItemRepository),
    getSoldItemsByItemId: soldItemRepository.getSoldItemsByItemId.bind(soldItemRepository),
    getSoldItemsByInventoryId: soldItemRepository.getSoldItemsByInventoryId.bind(soldItemRepository),
    getSoldItemsByInventoryIds: soldItemRepository.getSoldItemsByInventoryIds.bind(soldItemRepository),
    createSoldItem: soldItemRepository.createSoldItem.bind(soldItemRepository),
    // Expose transactional helpers
    createSoldItemWithStockUpdate: soldItemRepository.createSoldItemWithStockUpdate.bind(soldItemRepository),
    updateSoldItemWithStockAdjustment: soldItemRepository.updateSoldItemWithStockAdjustment.bind(soldItemRepository),
    deleteSoldItemWithStockRestore: soldItemRepository.deleteSoldItemWithStockRestore.bind(soldItemRepository),
}