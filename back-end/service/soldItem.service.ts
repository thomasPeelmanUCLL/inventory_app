import soldItemDB from '../repository/soldItem.db';
import { SoldItem } from '../model/soldItem';
import { createError } from '../util/errors';
import { getInventoryAnalytics } from './analytics.service';

const MAX_ANALYTICS_RANGE_DAYS = 730;
const DAY_MS = 24 * 60 * 60 * 1000;

const getSoldItemById = async ({ id }: { id: number }): Promise<SoldItem> => {
    const soldItem = await soldItemDB.getSoldItemById({ id });
    if (!soldItem) throw createError.notFound('Sold item not found');
    return soldItem;
};

const getAnalyticsByInventoryId = async ({
    inventoryId,
    startDate,
    endDate,
}: {
    inventoryId: number;
    startDate?: Date;
    endDate?: Date;
}) => {
    if (startDate && endDate && endDate.getTime() - startDate.getTime() > MAX_ANALYTICS_RANGE_DAYS * DAY_MS) {
        throw createError.badRequest('Date range cannot exceed 2 years');
    }
    return getInventoryAnalytics({ inventoryId, startDate, endDate });
};

export default {
    getSoldItemById,
    getSoldItemsByItemId: soldItemDB.getSoldItemsByItemId,
    getSoldItemsByInventoryIds: soldItemDB.getSoldItemsByInventoryIds,
    getSoldItemsByInventoryId: ({ inventoryId }: { inventoryId: number }) =>
        soldItemDB.getSoldItemsByInventoryIds({ inventoryIds: [inventoryId] }),
    createSoldItem: soldItemDB.createSoldItemWithStockUpdate,
    updateSoldItem: soldItemDB.updateSoldItemWithStockAdjustment,
    deleteSoldItem: soldItemDB.deleteSoldItemWithStockRestore,
    getAnalyticsByInventoryId,
};
