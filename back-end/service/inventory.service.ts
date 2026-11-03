import inventoryDB from '../repository/inventory.db';
import userDB from '../repository/user.db';
import { Inventory } from '../model/inventory';
import { createError } from '../util/errors';
import { requireInventoryRole } from './access.service';
import type { InventoryRole } from '../util/validators';

const getInventoriesByUserId = (userId: string) => inventoryDB.getInventoriesByUserId({ userId });

const getInventoryById = async (id: number, userId: string): Promise<Inventory> => {
    await requireInventoryRole(userId, id, 'read');
    const inventory = await inventoryDB.getInventoryById({ id });
    if (!inventory) throw createError.notFound('Inventory not found');
    return inventory;
};

const createInventory = (data: { name: string; description: string }, ownerId: string) =>
    inventoryDB.createInventory(new Inventory(data), ownerId);

const updateInventory = async (
    id: number,
    data: { name?: string; description?: string },
    userId: string,
): Promise<Inventory> => {
    await requireInventoryRole(userId, id, 'write');
    return inventoryDB.updateInventory({ id, ...data });
};

const deleteInventory = async (id: number, userId: string): Promise<void> => {
    await requireInventoryRole(userId, id, 'owner');
    await inventoryDB.deleteInventory({ id });
};

const getInventoryUsers = async (inventoryId: number, userId: string) => {
    await requireInventoryRole(userId, inventoryId, 'read');
    return inventoryDB.getInventoryUsers({ inventoryId });
};

/** Adds a member, identified by email (what the UI sends) or user id. */
const addUserToInventory = async (
    inventoryId: number,
    member: { email?: string; userId?: string; role: InventoryRole },
    requestingUserId: string,
): Promise<void> => {
    await requireInventoryRole(requestingUserId, inventoryId, 'owner');
    const user = member.userId
        ? await userDB.getUserById({ id: member.userId })
        : await userDB.getUserByEmail({ email: member.email! });
    if (!user) throw createError.notFound('No registered user with that email');
    await inventoryDB.addUserToInventory({ userId: user.getId(), inventoryId, role: member.role });
};

const removeUserFromInventory = async (
    userId: string,
    inventoryId: number,
    requestingUserId: string,
): Promise<void> => {
    await requireInventoryRole(requestingUserId, inventoryId, 'owner');
    if (userId === requestingUserId) throw createError.badRequest('Cannot remove yourself as owner');
    await inventoryDB.removeUserFromInventory({ userId, inventoryId });
};

export default {
    getInventoriesByUserId,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getInventoryUsers,
    addUserToInventory,
    removeUserFromInventory,
};
