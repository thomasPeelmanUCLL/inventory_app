import { SoldItem } from '../model/soldItem';
import { Item } from '../model/item';
import itemService from './item.service';
import soldItemDB from '../repository/soldItem.db';
import itemDB from '../repository/item.db';
import { Prisma } from '@prisma/client';

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

const getSoldItemsByInventoryId = async ({ inventoryId }: { inventoryId: number }): Promise<SoldItem[]> => {
    return await soldItemDB.getSoldItemsByInventoryId({ inventoryId });
};

const createSoldItem = async ({
                                  itemId,
                                  finalSellPrice,
                                  priceVariableName,
                                  isCustomPrice,
                                  payedCash = false,
                                  quantity,
                                  soldAt
                              }: {
    itemId: number;
    finalSellPrice: number | Prisma.Decimal;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    quantity: number;
    soldAt?: Date;
}): Promise<SoldItem> => {
    console.log('🔍 Backend received finalSellPrice:', finalSellPrice);
    console.log('🔍 Type:', typeof finalSellPrice);
    console.log('🔍 Value:', JSON.stringify(finalSellPrice));
    // Validate price
    const priceNum = typeof finalSellPrice === 'number' ? finalSellPrice : Number(finalSellPrice);
    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
        throw new Error('Invalid finalSellPrice: must be a positive number');
    }

    const item = await itemService.getItemById({ id: itemId });
    if (item.getQuantity() < quantity) {
        throw new Error(`Not enough quantity available for item with ID: ${itemId}`);
    }

    const soldItem = new SoldItem({
        itemId,
        finalSellPrice,
        priceVariableName,
        isCustomPrice,
        payedCash,
        quantity,
        soldAt
    });

    const createdSoldItem = await soldItemDB.createSoldItem(soldItem);

    // Update item quantity
    const updatedItem = await itemDB.getItemById({ id: itemId });
    if (updatedItem) {
        const newItem = new Item({
            id: updatedItem.getId(),
            name: updatedItem.getName(),
            description: updatedItem.getDescription(),
            buyPrice: updatedItem.getBuyPrice(),
            quantity: updatedItem.getQuantity() - quantity,
            inventoryId: updatedItem.getInventoryId(),
            priceVariableId: updatedItem.getPriceVariableId(),
            buyedAt: updatedItem.getBuyedAt(),
            createdAt: updatedItem.getCreatedAt()
        });
        await itemDB.updateItem(newItem);
    }

    return createdSoldItem;
};

const updateSoldItem = async ({
                                  id,
                                  finalSellPrice,
                                  priceVariableName,
                                  isCustomPrice,
                                  payedCash,
                                  quantity,
                                  soldAt
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

    let quantityDifference = 0;
    if (quantity !== undefined && quantity !== existingSoldItem.getQuantity()) {
        quantityDifference = existingSoldItem.getQuantity() - quantity;
        if (quantityDifference < 0 && item.getQuantity() < Math.abs(quantityDifference)) {
            throw new Error(`Not enough quantity available for item with ID: ${existingSoldItem.getItemId()}`);
        }
    }

    const updatedSoldItem = new SoldItem({
        id: existingSoldItem.getId(),
        itemId: existingSoldItem.getItemId(),
        finalSellPrice: finalSellPrice !== undefined ? finalSellPrice : existingSoldItem.getFinalSellPrice(),
        priceVariableName: priceVariableName !== undefined ? priceVariableName : existingSoldItem.getPriceVariableName(),
        isCustomPrice: isCustomPrice !== undefined ? isCustomPrice : existingSoldItem.getIsCustomPrice(),
        payedCash: payedCash !== undefined ? payedCash : existingSoldItem.isPayedCash(),
        quantity: quantity !== undefined ? quantity : existingSoldItem.getQuantity(),
        soldAt: soldAt !== undefined ? soldAt : existingSoldItem.getSoldAt(),
        createdAt: existingSoldItem.getCreatedAt()
    });

    const result = await soldItemDB.updateSoldItem(updatedSoldItem);
    if (!result) {
        throw new Error(`Failed to update SoldItem with ID: ${id}`);
    }

    // Adjust item quantity if changed
    if (quantityDifference !== 0) {
        const newItem = new Item({
            id: item.getId(),
            name: item.getName(),
            description: item.getDescription(),
            buyPrice: item.getBuyPrice(),
            quantity: item.getQuantity() + quantityDifference,
            inventoryId: item.getInventoryId(),
            priceVariableId: item.getPriceVariableId(),
            buyedAt: item.getBuyedAt(),
            createdAt: item.getCreatedAt()
        });
        await itemDB.updateItem(newItem);
    }

    return result;
};

const deleteSoldItem = async ({ id }: { id: number }): Promise<void> => {
    const soldItem = await getSoldItemById({ id });
    const item = await itemDB.getItemById({ id: soldItem.getItemId() });

    if (!item) {
        throw new Error(`Item with ID: ${soldItem.getItemId()} does not exist.`);
    }

    await soldItemDB.deleteSoldItem({ id });

    // Restore item quantity
    const newItem = new Item({
        id: item.getId(),
        name: item.getName(),
        description: item.getDescription(),
        buyPrice: item.getBuyPrice(),
        quantity: item.getQuantity() + soldItem.getQuantity(),
        inventoryId: item.getInventoryId(),
        priceVariableId: item.getPriceVariableId(),
        buyedAt: item.getBuyedAt(),
        createdAt: item.getCreatedAt()
    });
    await itemDB.updateItem(newItem);
};

export default {
    getAllSoldItems,
    getSoldItemById,
    getSoldItemsByItemId,
    getSoldItemsByInventoryId,
    createSoldItem,
    updateSoldItem,
    deleteSoldItem
};
