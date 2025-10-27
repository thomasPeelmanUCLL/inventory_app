import { Item } from '../model/item';
import { Item as ItemPrisma } from '@prisma/client';
import { BaseRepository } from './base.repository';

class ItemRepository extends BaseRepository<Item, ItemPrisma> {
    protected entityName = 'item';

    protected fromPrisma(prismaEntity: ItemPrisma): Item {
        return Item.from(prismaEntity);
    }

    protected getEntityId(entity: Item): number {
        return entity.getId();
    }

    async getAllItems(): Promise<Item[]> {
        return this.findMany({
            include: {
                priceVariable: true
            }
        });
    }

    async getItemById({ id }: { id: number }): Promise<Item | null> {
        return this.findUnique({
            where: { id },
            include: {
                priceVariable: true
            }
        });
    }

    async getItemsByInventoryId({ inventoryId }: { inventoryId: number }): Promise<Item[]> {
        return this.findMany({
            where: { inventoryId },
            include: {
                priceVariable: true
            }
        });
    }

    async createItem(item: Item): Promise<Item> {
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(), // Changed from price to buyPrice
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            inventoryId: item.getInventoryId(),
            priceVariableId: item.getPriceVariableId(), // Added
            // createdAt will be set automatically by Prisma
        };
        return this.create(data, {
            include: {
                priceVariable: true
            }
        });
    }

    async updateItem(item: Item): Promise<Item | null> {  // Add | null here
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(),
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            inventoryId: item.getInventoryId(),
            priceVariableId: item.getPriceVariableId(),
        };
        return this.update(item, data, {
            include: {
                priceVariable: true
            }
        });
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
    createItem: itemRepository.createItem.bind(itemRepository),
    updateItem: itemRepository.updateItem.bind(itemRepository),
    deleteItem: itemRepository.deleteItem.bind(itemRepository),
};
