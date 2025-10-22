import { SoldItem } from '../model/soldItem';
import { Item } from '../model/item';
import itemService from './item.service';
import soldItemDB from '../repository/soldItem.db';
import itemDB from '../repository/item.db';

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

const createSoldItem = async ({ 
    itemId, 
    sellingPrice, 
    payedCash = false, 
    quantity, 
    soldAt 
}: { 
    itemId: number; 
    sellingPrice: number; 
    payedCash?: boolean;
    quantity: number; 
    soldAt?: Date 
}): Promise<SoldItem> => {
    // Check if the item exists
    const item = await itemService.getItemById({ id: itemId });

    // Check if there's enough quantity
    if (item.getQuantity() < quantity) {
        throw new Error(`Not enough quantity available for item with ID: ${itemId}`);
    }

    // Create the sold item
    const soldItem = new SoldItem({
        itemId,
        sellingPrice,
        payedCash,
        quantity,
        soldAt
    });

    const createdSoldItem = await soldItemDB.createSoldItem(soldItem);

    // Update the item quantity
    const updatedItem = await itemDB.getItemById({ id: itemId });
    if (updatedItem) {
        const newItem = new Item({
            id: updatedItem.getId(),
            name: updatedItem.getName(),
            description: updatedItem.getDescription(),
            price: updatedItem.getPrice(),
            quantity: updatedItem.getQuantity() - quantity,
            buyedAt: updatedItem.getBuyedAt(),
            createdAt: updatedItem.getCreatedAt()
        });
        await itemDB.updateItem(newItem);
    }

    return createdSoldItem;
};

const updateSoldItem = async ({ 
    id, 
    sellingPrice, 
    payedCash, 
    quantity, 
    soldAt 
}: { 
    id: number; 
    sellingPrice?: number; 
    payedCash?: boolean;
    quantity?: number; 
    soldAt?: Date 
}): Promise<SoldItem> => {
    // Check if the sold item exists
    const existingSoldItem = await getSoldItemById({ id });

    // Get the current item
    const item = await itemDB.getItemById({ id: existingSoldItem.getItemId() });
    if (!item) {
        throw new Error(`Item with ID: ${existingSoldItem.getItemId()} does not exist.`);
    }

    // Calculate quantity difference if quantity is being updated
    let quantityDifference = 0;
    if (quantity !== undefined && quantity !== existingSoldItem.getQuantity()) {
        quantityDifference = existingSoldItem.getQuantity() - quantity;

        // Check if there's enough quantity if increasing
        if (quantityDifference < 0 && item.getQuantity() < Math.abs(quantityDifference)) {
            throw new Error(`Not enough quantity available for item with ID: ${existingSoldItem.getItemId()}`);
        }
    }

    // Create updated sold item
    const updatedSoldItem = new SoldItem({
        id: existingSoldItem.getId(),
        itemId: existingSoldItem.getItemId(),
        sellingPrice: sellingPrice !== undefined ? sellingPrice : existingSoldItem.getSellingPrice(),
        payedCash: payedCash !== undefined ? payedCash : existingSoldItem.isPayedCash(),
        quantity: quantity !== undefined ? quantity : existingSoldItem.getQuantity(),
        soldAt: soldAt !== undefined ? soldAt : existingSoldItem.getSoldAt(),
        createdAt: existingSoldItem.getCreatedAt()
    });

    // Update the sold item
    const result = await soldItemDB.updateSoldItem(updatedSoldItem);

    // Check if the update was successful
    if (!result) {
        throw new Error(`Failed to update SoldItem with ID: ${id}`);
    }

    // Update the item quantity if necessary
    if (quantityDifference !== 0) {
        const newItem = new Item({
            id: item.getId(),
            name: item.getName(),
            description: item.getDescription(),
            price: item.getPrice(),
            quantity: item.getQuantity() + quantityDifference,
            buyedAt: item.getBuyedAt(),
            createdAt: item.getCreatedAt()
        });
        await itemDB.updateItem(newItem);
    }

    return result;
};

const deleteSoldItem = async ({ id }: { id: number }): Promise<void> => {
    // Check if the sold item exists
    const soldItem = await getSoldItemById({ id });

    // Get the current item
    const item = await itemDB.getItemById({ id: soldItem.getItemId() });
    if (!item) {
        throw new Error(`Item with ID: ${soldItem.getItemId()} does not exist.`);
    }

    // Delete the sold item
    await soldItemDB.deleteSoldItem({ id });

    // Return the quantity to the item
    const newItem = new Item({
        id: item.getId(),
        name: item.getName(),
        description: item.getDescription(),
        price: item.getPrice(),
        quantity: item.getQuantity() + soldItem.getQuantity(),
        buyedAt: item.getBuyedAt(),
        createdAt: item.getCreatedAt()
    });
    await itemDB.updateItem(newItem);
};

export default {
    getAllSoldItems,
    getSoldItemById,
    getSoldItemsByItemId,
    createSoldItem,
    updateSoldItem,
    deleteSoldItem
};
