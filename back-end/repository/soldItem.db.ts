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

    // NEW: Bulk query for multiple inventories to avoid N+1
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

    // ... keep transactional methods and analytics from main branch version ...
}

const soldItemRepository = new SoldItemRepository();
export default {
    getAllSoldItems: soldItemRepository.getAllSoldItems.bind(soldItemRepository),
    getSoldItemById: soldItemRepository.getSoldItemById.bind(soldItemRepository),
    getSoldItemsByItemId: soldItemRepository.getSoldItemsByItemId.bind(soldItemRepository),
    getSoldItemsByInventoryId: soldItemRepository.getSoldItemsByInventoryId.bind(soldItemRepository),
    getSoldItemsByInventoryIds: soldItemRepository.getSoldItemsByInventoryIds.bind(soldItemRepository),
    createSoldItem: soldItemRepository.createSoldItem.bind(soldItemRepository),
    // transactional and analytics exports preserved by existing file; this patch adds bulk method only
}