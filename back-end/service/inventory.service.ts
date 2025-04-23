import inventoryDB from '../repository/inventory.db';
import { Inventory } from '../model/inventory';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const getAllInventories = async (): Promise<Inventory[]> => inventoryDB.getAllInventories();

const getInventoryById = async ({ id }: { id: number }): Promise<Inventory> => {
    const inventory = await inventoryDB.getInventoryById({ id });
    if (!inventory) {
        throw new Error(`Inventory with ID: ${id} does not exist.`);
    }
    return inventory;
};


const getInventoryByName = async ({ name }: { name: string }): Promise<Inventory> => {
    const inventory = await inventoryDB.getInventoryByName({ name });
    if (!inventory) {
        throw new Error(`Inventory with name: ${name} does not exist.`);
    }
    return inventory;
};

const createInventory = async ({ name, description, userId }: { name: string; description: string; userId: number }): Promise<Inventory> => {
    const existingInventory = await inventoryDB.getInventoryByName({ name });

    if (existingInventory) {
        throw new Error(`Inventory with name ${name} already exists.`);
    }

    const inventory = new Inventory({ name, description });

    return await inventoryDB.createInventory(inventory);
};

const updateInventory = async ({ id, name, description }: { id: number; name: string; description: string }): Promise<Inventory> => {
    const inventory = await getInventoryById({ id });

    if (!inventory) {
        throw new Error(`Inventory with ID: ${id} does not exist.`);
    }

    const updatedInventory = new Inventory({ id, name, description });
    const result = await inventoryDB.updateInventory(updatedInventory);

    if (!result) {
        throw new Error(`Failed to update inventory with ID: ${id}.`);
    }

    return result;
};

const deleteInventory = async ({ id }: { id: number }): Promise<void> => {
    const inventory = await getInventoryById({ id });

    if (!inventory) {
        throw new Error(`Inventory with ID: ${id} does not exist.`);
    }

    await inventoryDB.deleteInventory({ id });
};

export default {
    getAllInventories,
    getInventoryById,
    getInventoryByName,
    createInventory,
    updateInventory,
    deleteInventory,
};