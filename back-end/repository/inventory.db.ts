import { Inventory } from '../model/inventory';
import database from './database';

const getAllInventories = async (): Promise<Inventory[]> => {
    try {
        const inventoriesPrisma = await database.inventory.findMany({
            include: {
                items: true
            }
        });

        return inventoriesPrisma.map((inventoryPrisma) => {
            const items = inventoryPrisma.items.map(itemPrisma => {
                const { Item } = require('../model/item');
                return Item.from(itemPrisma);
            });
            return Inventory.from(inventoryPrisma, items);
        });
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
}

const getInventoryById = async ({ id }: { id: number }): Promise<Inventory | null> => {
    try {
        const inventoryPrisma = await database.inventory.findUnique({
            where: { id },
            include: {
                items: true
            }
        });

        if (!inventoryPrisma) {
            return null;
        }

        const items = inventoryPrisma.items.map(itemPrisma => {
            const { Item } = require('../model/item');
            return Item.from(itemPrisma);
        });

        return Inventory.from(inventoryPrisma, items);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const getInventoryByName = async ({ name }: { name: string }): Promise<Inventory | null> => {
    try {
        const inventoryPrisma = await database.inventory.findFirst({
            where: { name },
            include: {
                items: true
            }
        });

        if (!inventoryPrisma) {
            return null;
        }

        const items = inventoryPrisma.items.map(itemPrisma => {
            const { Item } = require('../model/item');
            return Item.from(itemPrisma);
        });

        return Inventory.from(inventoryPrisma, items);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const createInventory = async (inventory: Inventory): Promise<Inventory> => {
    try {
        const inventoryPrisma = await database.inventory.create({
            data: {
                name: inventory.getName(),
                description: inventory.getDescription(),
            },
        });

        return Inventory.from(inventoryPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const updateInventory = async (inventory: Inventory): Promise<Inventory | null> => {
    try {
        const inventoryPrisma = await database.inventory.update({
            where: { id: inventory.getId() },
            data: {
                name: inventory.getName(),
                description: inventory.getDescription(),
            },
        });

        return Inventory.from(inventoryPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

const deleteInventory = async ({ id }: { id: number }): Promise<Inventory | null> => {
    try {
        const inventoryPrisma = await database.inventory.delete({
            where: { id },
        });

        return Inventory.from(inventoryPrisma);
    } catch (error) {
        console.error(error);
        throw new Error('Database error. See server log for details.');
    }
};

export default {
    getAllInventories,
    getInventoryById,
    getInventoryByName,
    createInventory,
    updateInventory,
    deleteInventory,
};
