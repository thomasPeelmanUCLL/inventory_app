import { PrismaClient } from '@prisma/client';
import { Inventory } from '../model/inventory';

const prisma = new PrismaClient();

// Get all inventories for a specific user
const getInventoriesByUserId = async ({ userId }: { userId: string }): Promise<Inventory[]> => {
    const inventories = await prisma.inventory.findMany({
        where: {
            users: {
                some: {
                    userId: userId,
                },
            },
        },
        include: {
            items: {
                include: {
                    priceVariables: true,
                },
            },
            users: {
                include: {
                    user: true,
                },
            },
        },
    });
    return inventories.map((inv) => Inventory.from(inv));
};

const getAllInventorys = async (): Promise<Inventory[]> => {
    const inventorys = await prisma.inventory.findMany({
        include: {
            items: {
                include: {
                    priceVariables: true,
                },
            },
        },
    });
    return inventorys.map((inventory) => Inventory.from(inventory));
};

const getInventoryById = async ({ id }: { id: number }): Promise<Inventory | null> => {
    const inventoryPrisma = await prisma.inventory.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    priceVariables: true,
                },
            },
            users: {
                include: {
                    user: true,
                },
            },
        },
    });
    return inventoryPrisma ? Inventory.from(inventoryPrisma) : null;
};

const createInventory = async (inventory: Inventory, ownerId: string): Promise<Inventory> => {
    const inventoryPrisma = await prisma.inventory.create({
        data: {
            name: inventory.getName(),
            description: inventory.getDescription(),
            users: {
                create: {
                    userId: ownerId,
                    role: 'owner',
                },
            },
        },
        include: {
            items: {
                include: {
                    priceVariables: true,
                },
            },
            users: {
                include: {
                    user: true,
                },
            },
        },
    });
    return Inventory.from(inventoryPrisma);
};

const deleteInventory = async ({ id }: { id: number }): Promise<void> => {
    await prisma.inventory.delete({
        where: { id },
    });
};

// Check if user has access to inventory
const checkUserAccess = async ({
    userId,
    inventoryId,
}: {
    userId: string;
    inventoryId: number;
}): Promise<string | null> => {
    const access = await prisma.inventoryUser.findUnique({
        where: {
            userId_inventoryId: {
                userId,
                inventoryId,
            },
        },
    });
    return access ? access.role : null;
};

// Add user to inventory
const addUserToInventory = async ({
    userId,
    inventoryId,
    role,
}: {
    userId: string;
    inventoryId: number;
    role: string;
}): Promise<void> => {
    await prisma.inventoryUser.create({
        data: {
            userId,
            inventoryId,
            role,
        },
    });
};

// Remove user from inventory
const removeUserFromInventory = async ({
    userId,
    inventoryId,
}: {
    userId: string;
    inventoryId: number;
}): Promise<void> => {
    await prisma.inventoryUser.delete({
        where: {
            userId_inventoryId: {
                userId,
                inventoryId,
            },
        },
    });
};

const updateInventory = async ({
    id,
    name,
    description,
}: {
    id: number;
    name: string;
    description: string;
}): Promise<Inventory> => {
    const inventoryPrisma = await prisma.inventory.update({
        where: { id },
        data: {
            name,
            description,
        },
        include: {
            items: {
                include: {
                    priceVariables: true,
                },
            },
            users: {
                include: {
                    user: true,
                },
            },
        },
    });
    return Inventory.from(inventoryPrisma);
};

// Get users with access to inventory
const getInventoryUsers = async ({ inventoryId }: { inventoryId: number }) => {
    return await prisma.inventoryUser.findMany({
        where: { inventoryId },
        include: {
            user: true,
        },
    });
};

// Authorization helper functions
const userHasAccess = async ({
    userId,
    inventoryId,
}: {
    userId: string;
    inventoryId: number;
}): Promise<boolean> => {
    const access = await prisma.inventoryUser.findUnique({
        where: {
            userId_inventoryId: {
                userId,
                inventoryId,
            },
        },
    });
    return !!access;
};

const userHasAccessViaItem = async ({
    userId,
    itemId,
}: {
    userId: string;
    itemId: number;
}): Promise<boolean> => {
    const item = await prisma.item.findUnique({
        where: { id: itemId },
        select: { inventoryId: true },
    });

    if (!item?.inventoryId) {
        return false;
    }

    return userHasAccess({ userId, inventoryId: item.inventoryId });
};

export default {
    getAllInventorys,
    getInventoryById,
    createInventory,
    deleteInventory,
    getInventoriesByUserId,
    checkUserAccess,
    addUserToInventory,
    removeUserFromInventory,
    getInventoryUsers,
    updateInventory,
    // Authorization helpers
    userHasAccess,
    userHasAccessViaItem,
};
