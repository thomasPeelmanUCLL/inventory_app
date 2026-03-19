import { SoldItem } from '../model/soldItem';
import { Item } from '../model/item';
import itemService from './item.service';
import soldItemDB from '../repository/soldItem.db';
import itemDB from '../repository/item.db';
import { Prisma } from '@prisma/client';
import { getInventoryAnalyticsPrisma } from './analytics.service';

const getAllSoldItems = async (): Promise<SoldItem[]> => {
    return await soldItemDB.getAllSoldItems();
};

const getSoldItemById = async ({ id }: { id: number }): Promise<SoldItem> => {
    const soldItem = await soldItemDB.getSoldItemById({ id });
    if (!soldItem) {
        throw new Error(`SoldItem with ID: ${id} does not exist.`);
    }
    return soldItem;
};

const getSoldItemsByItemId = async ({ itemId }: { itemId: number }): Promise<SoldItem[]> => {
    return await soldItemDB.getSoldItemsByItemId({ itemId });
};

const getSoldItemsByInventoryId = async ({
    inventoryId,
}: {
    inventoryId: number;
}): Promise<SoldItem[]> => {
    return await soldItemDB.getSoldItemsByInventoryId({ inventoryId });
};

// NEW: Bulk query method to prevent N+1 queries
const getSoldItemsByInventoryIds = async ({
    inventoryIds,
}: {
    inventoryIds: number[];
}): Promise<SoldItem[]> => {
    if (inventoryIds.length === 0) return [];
    return await soldItemDB.getSoldItemsByInventoryIds({ inventoryIds });
};

// DEPRECATED: Use transactional methods in soldItemDB instead
const createSoldItem = async ({
    itemId,
    finalSellPrice,
    priceVariableName,
    isCustomPrice,
    payedCash = false,
    quantity,
    soldAt,
}: {
    itemId: number;
    finalSellPrice: number | Prisma.Decimal;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    quantity: number;
    soldAt?: Date;
}): Promise<SoldItem> => {
    const sellPriceDecimal =
        typeof finalSellPrice === 'number'
            ? new Prisma.Decimal(finalSellPrice.toFixed(2))
            : finalSellPrice;

    if (sellPriceDecimal.lessThanOrEqualTo(0)) {
        throw new Error('Final sell price must be positive');
    }

    if (quantity <= 0) {
        throw new Error('Quantity must be positive');
    }

    const item = await itemService.getItemById({ id: itemId });
    if (item.getQuantity() < quantity) {
        throw new Error(
            `Not enough quantity available for item with ID: ${itemId}. Available: ${item.getQuantity()}, Requested: ${quantity}`,
        );
    }

    const soldItem = new SoldItem({
        itemId,
        finalSellPrice: sellPriceDecimal,
        priceVariableName,
        isCustomPrice,
        payedCash,
        quantity,
        soldAt: soldAt || new Date(),
    });

    const createdSoldItem = await soldItemDB.createSoldItem(soldItem);

    const updatedItem = await itemDB.getItemById({ id: itemId });
    if (updatedItem) {
        const newItem = new Item({
            id: updatedItem.getId(),
            name: updatedItem.getName(),
            description: updatedItem.getDescription(),
            buyPrice: updatedItem.getBuyPrice(),
            quantity: updatedItem.getQuantity() - quantity,
            inventoryId: updatedItem.getInventoryId(),
            buyedAt: updatedItem.getBuyedAt(),
            createdAt: updatedItem.getCreatedAt(),
        });
        await itemDB.updateItem(newItem);
    }

    return createdSoldItem;
};

// DEPRECATED: Use transactional methods in soldItemDB instead
const updateSoldItem = async ({
    id,
    finalSellPrice,
    priceVariableName,
    isCustomPrice,
    payedCash,
    quantity,
    soldAt,
}: {
    id: number;
    finalSellPrice?: number | Prisma.Decimal;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    quantity?: number;
    soldAt?: Date;
}): Promise<SoldItem> => {
    const existingSoldItem = await getSoldItemById({ id });
    const item = await itemDB.getItemById({ id: existingSoldItem.getItemId() });

    if (!item) {
        throw new Error(`Item with ID: ${existingSoldItem.getItemId()} does not exist.`);
    }

    if (finalSellPrice !== undefined) {
        const sellPriceDecimal =
            typeof finalSellPrice === 'number'
                ? new Prisma.Decimal(finalSellPrice.toFixed(2))
                : finalSellPrice;

        if (sellPriceDecimal.lessThanOrEqualTo(0)) {
            throw new Error('Final sell price must be positive');
        }
    }

    let quantityDifference = 0;
    if (quantity !== undefined && quantity !== existingSoldItem.getQuantity()) {
        if (quantity <= 0) {
            throw new Error('Quantity must be positive');
        }

        quantityDifference = existingSoldItem.getQuantity() - quantity;
        if (quantityDifference < 0 && item.getQuantity() < Math.abs(quantityDifference)) {
            throw new Error(
                `Not enough quantity available for item with ID: ${existingSoldItem.getItemId()}. Available: ${item.getQuantity()}, Additional needed: ${Math.abs(quantityDifference)}`,
            );
        }
    }

    const updatedSoldItem = new SoldItem({
        id: existingSoldItem.getId(),
        itemId: existingSoldItem.getItemId(),
        finalSellPrice:
            finalSellPrice !== undefined ? finalSellPrice : existingSoldItem.getFinalSellPrice(),
        priceVariableName:
            priceVariableName !== undefined
                ? priceVariableName
                : existingSoldItem.getPriceVariableName(),
        isCustomPrice:
            isCustomPrice !== undefined ? isCustomPrice : existingSoldItem.getIsCustomPrice(),
        payedCash: payedCash !== undefined ? payedCash : existingSoldItem.isPayedCash(),
        quantity: quantity !== undefined ? quantity : existingSoldItem.getQuantity(),
        soldAt: soldAt !== undefined ? soldAt : existingSoldItem.getSoldAt(),
        createdAt: existingSoldItem.getCreatedAt(),
    });

    const result = await soldItemDB.updateSoldItem(updatedSoldItem);
    if (!result) {
        throw new Error(`Failed to update SoldItem with ID: ${id}`);
    }

    if (quantityDifference !== 0) {
        const newItem = new Item({
            id: item.getId(),
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(),
            quantity: item.getQuantity() + quantityDifference,
            inventoryId: item.getInventoryId(),
            buyedAt: item.getBuyedAt(),
            createdAt: item.getCreatedAt(),
        });
        await itemDB.updateItem(newItem);
    }

    return result;
};

// DEPRECATED: Use transactional methods in soldItemDB instead
const deleteSoldItem = async ({ id }: { id: number }): Promise<void> => {
    const soldItem = await getSoldItemById({ id });
    const item = await itemDB.getItemById({ id: soldItem.getItemId() });

    if (!item) {
        throw new Error(`Item with ID: ${soldItem.getItemId()} does not exist.`);
    }

    await soldItemDB.deleteSoldItem({ id });

    const newItem = new Item({
        id: item.getId(),
        name: item.getName(),
        description: item.getDescription(),
        buyPrice: item.getBuyPrice(),
        quantity: item.getQuantity() + soldItem.getQuantity(),
        inventoryId: item.getInventoryId(),
        buyedAt: item.getBuyedAt(),
        createdAt: item.getCreatedAt(),
    });
    await itemDB.updateItem(newItem);
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
    if (startDate && endDate && startDate > endDate) {
        throw new Error('Start date must be before end date');
    }

    if (startDate && endDate) {
        const diffMs = endDate.getTime() - startDate.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays > 730) {
            throw new Error('Date range cannot exceed 2 years');
        }
    }

    return await getInventoryAnalyticsPrisma({ inventoryId, startDate, endDate });
};

export default {
    getAllSoldItems,
    getSoldItemById,
    getSoldItemsByItemId,
    getSoldItemsByInventoryId,
    getSoldItemsByInventoryIds,
    createSoldItem,
    updateSoldItem,
    deleteSoldItem,
    getAnalyticsByInventoryId,
};
