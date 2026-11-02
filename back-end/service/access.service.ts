import inventoryDB from '../repository/inventory.db';
import { createError } from '../util/errors';
import type { InventoryRole } from '../util/validators';

/**
 * What a role may do in an inventory:
 *  read  - any member (viewer, editor, owner)
 *  write - change items, sales and prices (editor, owner)
 *  owner - manage members, delete the inventory (owner)
 */
export type AccessLevel = 'read' | 'write' | 'owner';

const ALLOWED: Record<AccessLevel, readonly InventoryRole[]> = {
    read: ['viewer', 'editor', 'owner'],
    write: ['editor', 'owner'],
    owner: ['owner'],
};

const DENIED: Record<AccessLevel, string> = {
    read: 'Access denied to this inventory',
    write: 'Only owners and editors can change this inventory',
    owner: 'Only owners can do this',
};

/** Throws 403 unless the user's role in the inventory allows `level`. Returns the role. */
export async function requireInventoryRole(
    userId: string,
    inventoryId: number,
    level: AccessLevel,
): Promise<InventoryRole> {
    const role = await inventoryDB.getUserRole({ userId, inventoryId });
    if (!role || !ALLOWED[level].includes(role)) throw createError.forbidden(DENIED[level]);
    return role;
}

/** Same check, for the inventory an item belongs to. Throws 404 for unknown items. */
export async function requireItemRole(userId: string, itemId: number, level: AccessLevel): Promise<number> {
    const inventoryId = await inventoryDB.getInventoryIdOfItem({ itemId });
    if (inventoryId === null) throw createError.notFound('Item not found');
    await requireInventoryRole(userId, inventoryId, level);
    return inventoryId;
}

/** Inventory ids the user is a member of. */
export async function getMemberInventoryIds(userId: string): Promise<number[]> {
    const inventories = await inventoryDB.getInventoriesByUserId({ userId });
    return inventories.map((inventory) => inventory.getId());
}
