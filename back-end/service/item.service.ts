import itemDB from '../repository/item.db';
import { Item } from '../model/item';
import { Prisma } from '@prisma/client';

const getAllItems = async (): Promise<Item[]> => itemDB.getAllItems();

const getItemById = async ({ id }: { id: number }): Promise<Item> => {
    const item = await itemDB.getItemById({ id });
    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }
    return item;
};

const getItemsByInventoryId = async ({ inventoryId }: { inventoryId: number }): Promise<Item[]> => {
    return await itemDB.getItemsByInventoryId({ inventoryId });
};

const createItem = async ({
                              name,
                              description,
                              buyPrice,
                              quantity,
                              buyedAt,
                              inventoryId,
                              priceVariableId
                          }: {
    name: string;
    description: string;
    buyPrice: number | Prisma.Decimal;
    quantity: number;
    buyedAt?: Date;
    inventoryId?: number;
    priceVariableId?: number;
}): Promise<Item> => {
    const item = new Item({
        name,
        description,
        buyPrice,  // Changed from price
        quantity,
        buyedAt,
        inventoryId,
        priceVariableId  // Added
    });
    return await itemDB.createItem(item);
};

const updateItem = async ({
                              id,
                              name,
                              description,
                              buyPrice,
                              quantity,
                              buyedAt,
                              inventoryId,
                              priceVariableId
                          }: {
    id: number;
    name: string;
    description: string;
    buyPrice: number | Prisma.Decimal;
    quantity: number;
    buyedAt?: Date;
    inventoryId?: number;
    priceVariableId?: number;
}): Promise<Item> => {
    const existingItem = await getItemById({ id });
    if (!existingItem) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }

    const updatedItem = new Item({
        id,
        name,
        description,
        buyPrice,  // Changed from price
        quantity,
        buyedAt,
        inventoryId,
        priceVariableId  // Added
    });

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
    await itemDB.deleteItem({ id });
};

export default {
    getAllItems,
    getItemById,
    getItemsByInventoryId,  // Added
    createItem,
    updateItem,
    deleteItem,
};
