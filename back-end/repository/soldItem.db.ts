import { SoldItem } from '../model/soldItem';
import { SoldItem as SoldItemPrisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

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
            include: {
                item: true
            }
        });
    }

    async getSoldItemById({ id }: { id: number }): Promise<SoldItem | null> {
        return this.findUnique({
            where: { id },
            include: {
                item: true
            }
        });
    }

    async getSoldItemsByItemId({ itemId }: { itemId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: { itemId },
            include: {
                item: true
            }
        });
    }

    // NEW METHOD - Add this
    async getSoldItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<SoldItem[]> {
        return this.findMany({
            where: {
                item: {
                    inventoryId: inventoryId
                }
            },
            include: {
                item: true,
            },
            orderBy: {
                soldAt: 'desc'
            }
        });
    }

    async createSoldItem(soldItem: SoldItem): Promise<SoldItem> {
        const data = {
            itemId: soldItem.getItemId(),
            sellingPrice: soldItem.getSellingPrice(),
            payedCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        return this.create(data, {
            include: {
                item: true
            }
        });
    }

    async updateSoldItem(soldItem: SoldItem): Promise<SoldItem | null> {
        const data = {
            sellingPrice: soldItem.getSellingPrice(),
            payedCash: soldItem.isPayedCash(),
            quantity: soldItem.getQuantity(),
            soldAt: soldItem.getSoldAt(),
        };
        return this.update(soldItem, data, {
            include: {
                item: true
            }
        });
    }

    async deleteSoldItem({ id }: { id: number }): Promise<void> {
        return this.delete(id);
    }
}

const soldItemRepository = new SoldItemRepository();

export default {
    getAllSoldItems: soldItemRepository.getAllSoldItems.bind(soldItemRepository),
    getSoldItemById: soldItemRepository.getSoldItemById.bind(soldItemRepository),
    getSoldItemsByItemId: soldItemRepository.getSoldItemsByItemId.bind(soldItemRepository),
    getSoldItemsByInventoryId: soldItemRepository.getSoldItemsByInventoryId.bind(soldItemRepository), // NEW
    createSoldItem: soldItemRepository.createSoldItem.bind(soldItemRepository),
    updateSoldItem: soldItemRepository.updateSoldItem.bind(soldItemRepository),
    deleteSoldItem: soldItemRepository.deleteSoldItem.bind(soldItemRepository),
};
