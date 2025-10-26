import inventoryDb from '../repository/inventory.db';
import { Inventory } from '../model/inventory';

const getAllInventorys = async (): Promise<Inventory[]> => {
    return await inventoryDb.getAllInventorys();
};

const getInventoriesByUserId = async (userId: string): Promise<Inventory[]> => {
    return await inventoryDb.getInventoriesByUserId({ userId });
};

const getInventoryById = async (id: number): Promise<Inventory> => {
    const inventory = await inventoryDb.getInventoryById({ id });
    if (!inventory) {
        throw new Error(`Inventory with id ${id} does not exist.`);
    }
    return inventory;
};

const createInventory = async (inventory: Inventory, ownerId: string): Promise<Inventory> => {
    return await inventoryDb.createInventory(inventory, ownerId);
};

const deleteInventory = async (id: number, userId: string): Promise<void> => {
    const role = await inventoryDb.checkUserAccess({ userId, inventoryId: id });
    if (role !== 'owner') {
        throw new Error('Only owners can delete inventories');
    }
    await inventoryDb.deleteInventory({ id });
};

const checkUserAccess = async (userId: string, inventoryId: number): Promise<string | null> => {
    return await inventoryDb.checkUserAccess({ userId, inventoryId });
};

const addUserToInventory = async (
    userId: string,
    inventoryId: number,
    role: string,
    requestingUserId: string
): Promise<void> => {
    const requestingUserRole = await inventoryDb.checkUserAccess({
        userId: requestingUserId,
        inventoryId
    });
    if (requestingUserRole !== 'owner') {
        throw new Error('Only owners can add users');
    }
    await inventoryDb.addUserToInventory({ userId, inventoryId, role });
};

const removeUserFromInventory = async (
    userId: string,
    inventoryId: number,
    requestingUserId: string
): Promise<void> => {
    const requestingUserRole = await inventoryDb.checkUserAccess({
        userId: requestingUserId,
        inventoryId
    });
    if (requestingUserRole !== 'owner') {
        throw new Error('Only owners can remove users');
    }
    if (userId === requestingUserId) {
        throw new Error('Cannot remove yourself as owner');
    }
    await inventoryDb.removeUserFromInventory({ userId, inventoryId });
};

const getInventoryUsers = async (inventoryId: number, requestingUserId: string) => {
    const role = await inventoryDb.checkUserAccess({
        userId: requestingUserId,
        inventoryId
    });
    if (!role) {
        throw new Error('Access denied');
    }
    return await inventoryDb.getInventoryUsers({ inventoryId });
};

const updateInventory = async (
    id: number,
    data: { name: string; description: string },
    requestingUserId: string
): Promise<Inventory> => {
    const role = await inventoryDb.checkUserAccess({
        userId: requestingUserId,
        inventoryId: id
    });
    if (role !== 'owner' && role !== 'editor') {
        throw new Error('Only owners and editors can update inventories');
    }
    return await inventoryDb.updateInventory({
        id,
        name: data.name,
        description: data.description
    });
};

export default {
    getAllInventorys,
    getInventoriesByUserId,
    getInventoryById,
    createInventory,
    deleteInventory,
    checkUserAccess,
    addUserToInventory,
    removeUserFromInventory,
    getInventoryUsers,
    updateInventory,
};
