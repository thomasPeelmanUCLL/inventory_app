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
        return this.findMany();
    }

    async getItemById({ id }: { id: number }): Promise<Item | null> {
        return this.findUnique({ where: { id } });
    }

    async createItem(item: Item): Promise<Item> {
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            price: item.getPrice(),
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            // createdAt will be set automatically by Prisma
        };
        return this.create(data);
    }

    async updateItem(item: Item): Promise<Item | null> {
        const data = {
            name: item.getName(),
            description: item.getDescription(),
            price: item.getPrice(),
            quantity: item.getQuantity(),
            buyedAt: item.getBuyedAt(),
            // createdAt should not be updated
        };
        return this.update(item, data);
    }

    async deleteItem({ id }: { id: number }): Promise<void> {
        return this.delete(id);
    }
}

const itemRepository = new ItemRepository();

export default {
    getAllItems: itemRepository.getAllItems.bind(itemRepository),
    getItemById: itemRepository.getItemById.bind(itemRepository),
    createItem: itemRepository.createItem.bind(itemRepository),
    updateItem: itemRepository.updateItem.bind(itemRepository),
    deleteItem: itemRepository.deleteItem.bind(itemRepository),
};
