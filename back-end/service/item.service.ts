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

// NEW: Bulk query method to prevent N+1 queries
const getItemsByInventoryIds = async ({
    inventoryIds,
}: {
    inventoryIds: number[];
}): Promise<Item[]> => {
    if (inventoryIds.length === 0) return [];
    return await itemDB.getItemsByInventoryIds({ inventoryIds });
};

const createItem = async ({
    name,
    description,
    buyPrice,
    quantity,
    buyedAt,
    inventoryId,
}: {
    name: string;
    description: string;
    buyPrice: number | Prisma.Decimal;
    quantity: number;
    buyedAt?: Date;
    inventoryId?: number;
}): Promise<Item> => {
    // Enhanced validation for financial precision
    const buyPriceDecimal =
        typeof buyPrice === 'number' ? new Prisma.Decimal(buyPrice.toFixed(2)) : buyPrice;

    if (buyPriceDecimal.lessThan(0)) {
        throw new Error('Buy price cannot be negative');
    }

    if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
    }

    const item = new Item({
        name,
        description,
        buyPrice: buyPriceDecimal,
        quantity,
        buyedAt,
        inventoryId,
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
}: {
    id: number;
    name?: string;
    description?: string;
    buyPrice?: number | Prisma.Decimal;
    quantity?: number;
    buyedAt?: Date;
    inventoryId?: number;
}): Promise<Item> => {
    const existingItem = await getItemById({ id });
    if (!existingItem) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }

    // Enhanced validation for updates
    let buyPriceDecimal = existingItem.getBuyPrice();
    if (buyPrice !== undefined) {
        buyPriceDecimal =
            typeof buyPrice === 'number' ? new Prisma.Decimal(buyPrice.toFixed(2)) : buyPrice;

        if (buyPriceDecimal.lessThan(0)) {
            throw new Error('Buy price cannot be negative');
        }
    }

    const finalQuantity = quantity !== undefined ? quantity : existingItem.getQuantity();
    if (finalQuantity < 0) {
        throw new Error('Quantity cannot be negative');
    }

    const updatedItem = new Item({
        id,
        name: name !== undefined ? name : existingItem.getName(),
        description: description !== undefined ? description : existingItem.getDescription(),
        buyPrice: buyPriceDecimal,
        quantity: finalQuantity,
        buyedAt: buyedAt !== undefined ? buyedAt : existingItem.getBuyedAt(),
        inventoryId: inventoryId !== undefined ? inventoryId : existingItem.getInventoryId(),
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
    getItemsByInventoryId,
    getItemsByInventoryIds, // NEW bulk method
    createItem,
    updateItem,
    deleteItem,
};
