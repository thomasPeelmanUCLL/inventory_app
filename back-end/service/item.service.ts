import itemDB from '../repository/item.db';
import { Item } from '../model/item';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllItems = async (): Promise<Item[]> => itemDB.getAllItems();

const getItemById = async ({ id }: { id: number }): Promise<Item> => {
    const item = await itemDB.getItemById({ id });
    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }
    return item;
};

const createItem = async ({ name, description, price, quantity, buyedAt, inventoryId }: { name: string; description: string; price: number; quantity: number; buyedAt?: Date; inventoryId?: number }): Promise<Item> => {
    const item = new Item({ name, description, price, quantity, buyedAt, inventoryId });

    return await itemDB.createItem(item);
};

const updateItem = async ({ id, name, description, price, quantity, buyedAt, inventoryId }: { id: number; name: string; description: string; price: number; quantity: number; buyedAt?: Date; inventoryId?: number }): Promise<Item> => {
    const item = await getItemById({ id });

    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }

    const updatedItem = new Item({ id, name, description, price, quantity, buyedAt, inventoryId });
    const result = await itemDB.updateItem(updatedItem);

    if (!result) {
        throw new Error(`Failed to update item with ID: ${id}.`);
    }

    return result;
};

const deleteItem = async ({ id }: { id: number }): Promise<void> => {
    const item = await getItemById({ id });

    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }

};

export default {
    getAllItems,
    getItemById,
    createItem,
    updateItem,
    deleteItem,
};
