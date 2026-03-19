import { Item } from '../model/item';
import { Item as ItemPrisma, PriceVariable as PriceVariablePrisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

type ItemWithPriceVariables = ItemPrisma & {
    priceVariables?: PriceVariablePrisma[];
};

class ItemRepository extends BaseRepository<Item, ItemPrisma> {
    protected entityName = 'item';

    protected fromPrisma(prismaEntity: ItemWithPriceVariables): Item {
        return Item.from(prismaEntity);
    }

    protected getEntityId(entity: Item): number {
        return entity.getId();
    }

    async getAllItems(): Promise<Item[]> {
        return this.findMany({
            include: {
                priceVariables: true,
            },
        });
    }

    async getItemById({ id }: { id: number }): Promise<Item | null> {
        return this.findUnique({
            where: { id },
            include: {
                priceVariables: true,
            },
        });
    }

    async getItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<Item[]> {
        return this.findMany({
            where: { inventoryId },
            include: {
                priceVariables: true,
            },
            orderBy: {
                name: 'asc',
            },
        });
    }

    // NEW: Bulk query to prevent N+1 queries when fetching items from multiple inventories
    async getItemsByInventoryIds({ inventoryIds }: { inventoryIds: number[] }): Promise<Item[]> {
        if (inventoryIds.length === 0) return [];

        return this.findMany({
            where: {
                inventoryId: {
                    in: inventoryIds,
                },
            },
            include: {
                priceVariables: true,
            },
            orderBy: [{ inventoryId: 'asc' }, { name: 'asc' }],
        });
    }

    async createItem(item: Item): Promise<Item> {
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(),
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            inventoryId: item.getInventoryId(),
        };

        return this.create(data, {
            include: {
                priceVariables: true,
            },
        });
    }

    async updateItem(item: Item): Promise<Item> {
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(),
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            inventoryId: item.getInventoryId(),
        };

        const result = await this.update(item, data, {
            include: {
                priceVariables: true,
            },
        });

        if (!result) {
            throw new Error(`Failed to update item with ID: ${item.getId()}`);
        }

        return result;
    }

    async deleteItem({ id }: { id: number }): Promise<void> {
        return this.delete(id);
    }
}

const itemRepository = new ItemRepository();

export default {
    getAllItems: itemRepository.getAllItems.bind(itemRepository),
    getItemById: itemRepository.getItemById.bind(itemRepository),
    getItemsByInventoryId: itemRepository.getItemsByInventoryId.bind(itemRepository),
    getItemsByInventoryIds: itemRepository.getItemsByInventoryIds.bind(itemRepository), // NEW
    createItem: itemRepository.createItem.bind(itemRepository),
    updateItem: itemRepository.updateItem.bind(itemRepository),
    deleteItem: itemRepository.deleteItem.bind(itemRepository),
};
