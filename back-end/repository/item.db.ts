import { Prisma } from '@prisma/client';
import database from './database';
import { Item } from '../model/item';

const withPriceVariables = { priceVariables: true } as const;

const toData = (item: Item) => ({
    name: item.getName(),
    description: item.getDescription(),
    buyPrice: item.getBuyPrice(),
    quantity: item.getQuantity(),
    buyedAt: item.getBuyedAt(),
    inventoryId: item.getInventoryId(),
    websiteCategory: item.getWebsiteCategory(),
    websiteEmoji: item.getWebsiteEmoji(),
    websiteSortOrder: item.getWebsiteSortOrder(),
    memberPrice: item.getMemberPrice(),
    nonMemberPrice: item.getNonMemberPrice(),
    publishedToWebsite: item.getPublishedToWebsite(),
});

const getItemById = async ({ id }: { id: number }): Promise<Item | null> => {
    const item = await database.item.findUnique({ where: { id }, include: withPriceVariables });
    return item ? Item.from(item) : null;
};

const getItemsByInventoryIds = async ({ inventoryIds }: { inventoryIds: number[] }): Promise<Item[]> => {
    if (inventoryIds.length === 0) return [];
    const items = await database.item.findMany({
        where: { inventoryId: { in: inventoryIds } },
        include: withPriceVariables,
        orderBy: [{ inventoryId: 'asc' }, { name: 'asc' }],
    });
    return items.map(Item.from);
};

const getItemsByInventoryId = ({ inventoryId }: { inventoryId: number }) =>
    getItemsByInventoryIds({ inventoryIds: [inventoryId] });

const createItem = async (
    item: Item,
    priceVariables: Array<Omit<Prisma.PriceVariableCreateManyItemInput, 'id'>> = [],
): Promise<Item> => {
    const created = await database.item.create({
        data: {
            ...toData(item),
            ...(priceVariables.length > 0 && { priceVariables: { create: priceVariables } }),
        },
        include: withPriceVariables,
    });
    return Item.from(created);
};

const updateItem = async (item: Item): Promise<Item> => {
    const updated = await database.item.update({
        where: { id: item.getId() },
        data: toData(item),
        include: withPriceVariables,
    });
    return Item.from(updated);
};

const deleteItem = async ({ id }: { id: number }): Promise<void> => {
    await database.item.delete({ where: { id } });
};

export default {
    getItemById,
    getItemsByInventoryId,
    getItemsByInventoryIds,
    createItem,
    updateItem,
    deleteItem,
};
