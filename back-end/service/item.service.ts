import itemDB from '../repository/item.db';
import { Item } from '../model/item';
import { Prisma } from '@prisma/client';

const getAllItems = async (): Promise<Item[]> => itemDB.getAllItems();

const getItemById = async ({ id }: { id: number }): Promise<Item> => {
    const item = await itemDB.getItemById({ id });
    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }
    return item;
};

const getItemsByInventoryId = async ({ inventoryId }: { inventoryId: number }): Promise<Item[]> => {
    return await itemDB.getItemsByInventoryId({ inventoryId });
};

const hasAtMostTwoDecimals = (value: number): boolean =>
    Math.abs(value * 100 - Math.round(value * 100)) < Number.EPSILON * 1000;

const toMoneyDecimal = (
    value: number | Prisma.Decimal | null | undefined,
    fieldName: string,
): Prisma.Decimal | null => {
    if (value === undefined || value === null) return null;

    const decimalValue = typeof value === 'number' ? new Prisma.Decimal(value) : value;
    const numericValue = decimalValue.toNumber();
    if (numericValue < 0) {
        throw new Error(`${fieldName} cannot be negative`);
    }
    if (!hasAtMostTwoDecimals(numericValue)) {
        throw new Error(`${fieldName} must have at most 2 decimal places`);
    }
    return new Prisma.Decimal(numericValue.toFixed(2));
};

const toOptionalTrimmedString = (value: string | null | undefined): string | null => {
    if (value === undefined || value === null) return null;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
};

const validateWebsitePublicationFields = ({
    publishedToWebsite,
    websiteCategory,
    memberPrice,
    nonMemberPrice,
}: {
    publishedToWebsite: boolean;
    websiteCategory: string | null;
    memberPrice: Prisma.Decimal | null;
    nonMemberPrice: Prisma.Decimal | null;
}) => {
    if (!publishedToWebsite) return;
    if (!websiteCategory) {
        throw new Error('Website category is required when publishing an item');
    }
    if (!memberPrice || !nonMemberPrice) {
        throw new Error('Member and non-member prices are required when publishing an item');
    }
};

// NEW: Bulk query method to prevent N+1 queries
const getItemsByInventoryIds = async ({
    inventoryIds,
}: {
    inventoryIds: number[];
}): Promise<Item[]> => {
    if (inventoryIds.length === 0) return [];
    return await itemDB.getItemsByInventoryIds({ inventoryIds });
};

const createItem = async ({
    name,
    description,
    buyPrice,
    quantity,
    buyedAt,
    inventoryId,
    priceVariables,
    websiteCategory,
    websiteEmoji,
    websiteSortOrder,
    memberPrice,
    nonMemberPrice,
    publishedToWebsite,
}: {
    name: string;
    description: string;
    buyPrice: number | Prisma.Decimal;
    quantity: number;
    buyedAt?: Date;
    inventoryId?: number;
    priceVariables?: Array<{ name: string; value: number; type: string; isDefault?: boolean }>;
    websiteCategory?: string | null;
    websiteEmoji?: string | null;
    websiteSortOrder?: number;
    memberPrice?: number | Prisma.Decimal | null;
    nonMemberPrice?: number | Prisma.Decimal | null;
    publishedToWebsite?: boolean;
}): Promise<Item> => {
    // Enhanced validation for financial precision
    const buyPriceDecimal =
        typeof buyPrice === 'number' ? new Prisma.Decimal(buyPrice.toFixed(2)) : buyPrice;

    if (buyPriceDecimal.lessThan(0)) {
        throw new Error('Buy price cannot be negative');
    }

    if (quantity < 0) {
        throw new Error('Quantity cannot be negative');
    }
    if (websiteSortOrder !== undefined && !Number.isInteger(websiteSortOrder)) {
        throw new Error('Website sort order must be an integer');
    }

    // Validate price variables if provided
    if (priceVariables) {
        for (const pv of priceVariables) {
            if (!pv.name || pv.name.trim() === '') {
                throw new Error('Price variable name cannot be empty');
            }
            if (typeof pv.value !== 'number' || pv.value < 0) {
                throw new Error('Price variable value must be a positive number');
            }
            if (!pv.type || !['PERCENTAGE', 'FIXED'].includes(pv.type)) {
                throw new Error('Price variable type must be PERCENTAGE or FIXED');
            }
        }
    }

    const parsedWebsiteCategory = toOptionalTrimmedString(websiteCategory);
    const parsedWebsiteEmoji = toOptionalTrimmedString(websiteEmoji);
    const parsedMemberPrice = toMoneyDecimal(memberPrice, 'Member price');
    const parsedNonMemberPrice = toMoneyDecimal(nonMemberPrice, 'Non-member price');
    const parsedPublishedToWebsite = publishedToWebsite ?? false;
    validateWebsitePublicationFields({
        publishedToWebsite: parsedPublishedToWebsite,
        websiteCategory: parsedWebsiteCategory,
        memberPrice: parsedMemberPrice,
        nonMemberPrice: parsedNonMemberPrice,
    });

    const item = new Item({
        name,
        description,
        buyPrice: buyPriceDecimal,
        quantity,
        buyedAt,
        inventoryId,
        websiteCategory: parsedWebsiteCategory,
        websiteEmoji: parsedWebsiteEmoji,
        websiteSortOrder: websiteSortOrder ?? 0,
        memberPrice: parsedMemberPrice,
        nonMemberPrice: parsedNonMemberPrice,
        publishedToWebsite: parsedPublishedToWebsite,
    });
    return await itemDB.createItem(item, priceVariables);
};

const updateItem = async ({
    id,
    name,
    description,
    buyPrice,
    quantity,
    buyedAt,
    inventoryId,
    websiteCategory,
    websiteEmoji,
    websiteSortOrder,
    memberPrice,
    nonMemberPrice,
    publishedToWebsite,
}: {
    id: number;
    name?: string;
    description?: string;
    buyPrice?: number | Prisma.Decimal;
    quantity?: number;
    buyedAt?: Date;
    inventoryId?: number;
    websiteCategory?: string | null;
    websiteEmoji?: string | null;
    websiteSortOrder?: number;
    memberPrice?: number | Prisma.Decimal | null;
    nonMemberPrice?: number | Prisma.Decimal | null;
    publishedToWebsite?: boolean;
}): Promise<Item> => {
    const existingItem = await getItemById({ id });
    if (!existingItem) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }

    // Enhanced validation for updates
    let buyPriceDecimal = existingItem.getBuyPrice();
    if (buyPrice !== undefined) {
        buyPriceDecimal =
            typeof buyPrice === 'number' ? new Prisma.Decimal(buyPrice.toFixed(2)) : buyPrice;

        if (buyPriceDecimal.lessThan(0)) {
            throw new Error('Buy price cannot be negative');
        }
    }

    const finalQuantity = quantity !== undefined ? quantity : existingItem.getQuantity();
    if (finalQuantity < 0) {
        throw new Error('Quantity cannot be negative');
    }
    if (websiteSortOrder !== undefined && !Number.isInteger(websiteSortOrder)) {
        throw new Error('Website sort order must be an integer');
    }

    const finalWebsiteCategory =
        websiteCategory !== undefined
            ? toOptionalTrimmedString(websiteCategory)
            : existingItem.getWebsiteCategory() ?? null;
    const finalWebsiteEmoji =
        websiteEmoji !== undefined
            ? toOptionalTrimmedString(websiteEmoji)
            : existingItem.getWebsiteEmoji() ?? null;
    const finalMemberPrice =
        memberPrice !== undefined
            ? toMoneyDecimal(memberPrice, 'Member price')
            : existingItem.getMemberPrice() ?? null;
    const finalNonMemberPrice =
        nonMemberPrice !== undefined
            ? toMoneyDecimal(nonMemberPrice, 'Non-member price')
            : existingItem.getNonMemberPrice() ?? null;
    const finalPublishedToWebsite =
        publishedToWebsite !== undefined
            ? publishedToWebsite
            : existingItem.getPublishedToWebsite() ?? false;

    validateWebsitePublicationFields({
        publishedToWebsite: finalPublishedToWebsite,
        websiteCategory: finalWebsiteCategory,
        memberPrice: finalMemberPrice,
        nonMemberPrice: finalNonMemberPrice,
    });

    const updatedItem = new Item({
        id,
        name: name !== undefined ? name : existingItem.getName(),
        description: description !== undefined ? description : existingItem.getDescription(),
        buyPrice: buyPriceDecimal,
        quantity: finalQuantity,
        buyedAt: buyedAt !== undefined ? buyedAt : existingItem.getBuyedAt(),
        inventoryId: inventoryId !== undefined ? inventoryId : existingItem.getInventoryId(),
        websiteCategory: finalWebsiteCategory,
        websiteEmoji: finalWebsiteEmoji,
        websiteSortOrder:
            websiteSortOrder !== undefined
                ? websiteSortOrder
                : existingItem.getWebsiteSortOrder() ?? 0,
        memberPrice: finalMemberPrice,
        nonMemberPrice: finalNonMemberPrice,
        publishedToWebsite: finalPublishedToWebsite,
    });

    const result = await itemDB.updateItem(updatedItem);
    if (!result) {
        throw new Error(`Failed to update item with ID: ${id}.`);
    }
    return result;
};

const deleteItem = async ({ id }: { id: number }): Promise<void> => {
    const item = await getItemById({ id });
    if (!item) {
        throw new Error(`Item with ID: ${id} does not exist.`);
    }
    await itemDB.deleteItem({ id });
};

export default {
    getAllItems,
    getItemById,
    getItemsByInventoryId,
    getItemsByInventoryIds, // NEW bulk method
    createItem,
    updateItem,
    deleteItem,
};
