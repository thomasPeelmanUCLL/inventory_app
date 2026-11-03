import database from './database';
import { Inventory } from '../model/inventory';
import type { InventoryRole } from '../util/validators';

const withMembers = {
    users: { include: { user: { select: { id: true, name: true, email: true } } } },
} as const;
const withItemsAndMembers = { items: { include: { priceVariables: true } }, ...withMembers } as const;

/** The list view only needs names and roles, not every item. */
const getInventoriesByUserId = async ({ userId }: { userId: string }): Promise<Inventory[]> => {
    const inventories = await database.inventory.findMany({
        where: { users: { some: { userId } } },
        include: withMembers,
        orderBy: { name: 'asc' },
    });
    return inventories.map(Inventory.from);
};

const getInventoryById = async ({ id }: { id: number }): Promise<Inventory | null> => {
    const inventory = await database.inventory.findUnique({
        where: { id },
        include: {
            ...withMembers,
            items: { include: { priceVariables: true }, orderBy: { name: 'asc' } },
        },
    });
    return inventory ? Inventory.from(inventory) : null;
};

const createInventory = async (inventory: Inventory, ownerId: string): Promise<Inventory> => {
    const created = await database.inventory.create({
        data: {
            name: inventory.getName(),
            description: inventory.getDescription(),
            users: { create: { userId: ownerId, role: 'owner' } },
        },
        include: withItemsAndMembers,
    });
    return Inventory.from(created);
};

const updateInventory = async ({
    id,
    ...data
}: {
    id: number;
    name?: string;
    description?: string;
}): Promise<Inventory> => {
    const updated = await database.inventory.update({ where: { id }, data, include: withItemsAndMembers });
    return Inventory.from(updated);
};

const deleteInventory = async ({ id }: { id: number }): Promise<void> => {
    await database.inventory.delete({ where: { id } });
};

/** The user's role in the inventory, or null when they are not a member. */
const getUserRole = async ({
    userId,
    inventoryId,
}: {
    userId: string;
    inventoryId: number;
}): Promise<InventoryRole | null> => {
    const membership = await database.inventoryUser.findUnique({
        where: { userId_inventoryId: { userId, inventoryId } },
        select: { role: true },
    });
    return (membership?.role as InventoryRole | undefined) ?? null;
};

const getInventoryIdOfItem = async ({ itemId }: { itemId: number }): Promise<number | null> => {
    const item = await database.item.findUnique({ where: { id: itemId }, select: { inventoryId: true } });
    return item?.inventoryId ?? null;
};

const getInventoryUsers = ({ inventoryId }: { inventoryId: number }) =>
    database.inventoryUser.findMany({ where: { inventoryId }, ...withMembers.users });

const addUserToInventory = async (data: { userId: string; inventoryId: number; role: InventoryRole }) => {
    await database.inventoryUser.create({ data });
};

const removeUserFromInventory = async ({ userId, inventoryId }: { userId: string; inventoryId: number }) => {
    await database.inventoryUser.delete({ where: { userId_inventoryId: { userId, inventoryId } } });
};

export default {
    getInventoriesByUserId,
    getInventoryById,
    createInventory,
    updateInventory,
    deleteInventory,
    getUserRole,
    getInventoryIdOfItem,
    getInventoryUsers,
    addUserToInventory,
    removeUserFromInventory,
};
