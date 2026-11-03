import { Prisma } from '@prisma/client';
import database from './database';
import { SoldItem } from '../model/soldItem';
import { createError } from '../util/errors';
import type { SoldItemInput, SoldItemUpdateInput } from '../util/validators';

const withItem = { item: true } as const;
const newestFirst = { soldAt: 'desc' } as const;

const findSoldItems = async (where: Prisma.SoldItemWhereInput): Promise<SoldItem[]> => {
    const soldItems = await database.soldItem.findMany({ where, include: withItem, orderBy: newestFirst });
    return soldItems.map(SoldItem.from);
};

const getSoldItemById = async ({ id }: { id: number }): Promise<SoldItem | null> => {
    const soldItem = await database.soldItem.findUnique({ where: { id }, include: withItem });
    return soldItem ? SoldItem.from(soldItem) : null;
};

const getSoldItemsByItemId = ({ itemId }: { itemId: number }) => findSoldItems({ itemId });

const getSoldItemsByInventoryIds = ({ inventoryIds }: { inventoryIds: number[] }) =>
    inventoryIds.length === 0
        ? Promise.resolve([])
        : findSoldItems({ item: { inventoryId: { in: inventoryIds } } });

/** Moves `delta` units into (positive) or out of (negative) an item's stock, refusing to go below 0. */
const adjustStock = async (tx: Prisma.TransactionClient, itemId: number, delta: number) => {
    if (delta === 0) return;
    // Conditional update so two concurrent sales can't both take the last unit
    const { count } = await tx.item.updateMany({
        where: { id: itemId, ...(delta < 0 && { quantity: { gte: -delta } }) },
        data: { quantity: { increment: delta } },
    });
    if (count > 0) return;
    const item = await tx.item.findUnique({ where: { id: itemId }, select: { name: true, quantity: true } });
    if (!item) throw createError.notFound('Item not found');
    throw createError.badRequest(
        `Not enough stock available for ${item.name}. Available: ${item.quantity}, Requested: ${-delta}`,
    );
};

/** Records a sale and takes it out of stock, atomically. */
const createSoldItemWithStockUpdate = (input: SoldItemInput): Promise<SoldItem> =>
    database.$transaction(async (tx) => {
        await adjustStock(tx, input.itemId, -input.quantity);
        const created = await tx.soldItem.create({
            data: {
                itemId: input.itemId,
                finalSellPrice: input.finalSellPrice,
                quantity: input.quantity,
                priceVariableName: input.priceVariableName ?? null,
                isCustomPrice: input.isCustomPrice,
                paidCash: input.paidCash,
                soldAt: input.soldAt ?? new Date(),
            },
            include: withItem,
        });
        return SoldItem.from(created);
    });

/** Edits a sale; a quantity change is mirrored in the item's stock. */
const updateSoldItemWithStockAdjustment = (id: number, patch: SoldItemUpdateInput): Promise<SoldItem> =>
    database.$transaction(async (tx) => {
        const existing = await tx.soldItem.findUnique({ where: { id } });
        if (!existing) throw createError.notFound('Sold item not found');
        if (patch.quantity !== undefined) {
            await adjustStock(tx, existing.itemId, existing.quantity - patch.quantity);
        }
        const updated = await tx.soldItem.update({
            where: { id },
            data: {
                finalSellPrice: patch.finalSellPrice,
                priceVariableName: patch.priceVariableName,
                isCustomPrice: patch.isCustomPrice,
                paidCash: patch.paidCash,
                quantity: patch.quantity,
                soldAt: patch.soldAt,
            },
            include: withItem,
        });
        return SoldItem.from(updated);
    });

/** Reverts a sale: deletes it and puts the units back in stock. */
const deleteSoldItemWithStockRestore = (id: number): Promise<void> =>
    database.$transaction(async (tx) => {
        const existing = await tx.soldItem.findUnique({ where: { id }, select: { itemId: true, quantity: true } });
        if (!existing) return;
        await tx.soldItem.delete({ where: { id } });
        await adjustStock(tx, existing.itemId, existing.quantity);
    });

export default {
    getSoldItemById,
    getSoldItemsByItemId,
    getSoldItemsByInventoryIds,
    createSoldItemWithStockUpdate,
    updateSoldItemWithStockAdjustment,
    deleteSoldItemWithStockRestore,
};
