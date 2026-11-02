import { Prisma } from '@prisma/client';
import itemDB from '../repository/item.db';
import { Item, ItemFields, Money, toDecimal } from '../model/item';
import { createError } from '../util/errors';

type PriceVariableInput = { name: string; value: number; type: string; isDefault?: boolean };

const hasAtMostTwoDecimals = (value: Prisma.Decimal) => value.decimalPlaces() <= 2;

/** Website prices: non-negative, at most 2 decimals, normalized to 2 decimal places. */
const toWebsitePrice = (value: Money | null | undefined, fieldName: string): Prisma.Decimal | null => {
    if (value == null) return null;
    const decimal = toDecimal(value);
    if (decimal.isNegative()) throw createError.badRequest(`${fieldName} cannot be negative`);
    if (!hasAtMostTwoDecimals(decimal)) {
        throw createError.badRequest(`${fieldName} must have at most 2 decimal places`);
    }
    return new Prisma.Decimal(decimal.toFixed(2));
};

const trimToNull = (value: string | null | undefined): string | null => value?.trim() || null;

/** Normalizes item fields and builds the Item. Shared by create and update so both apply the same rules. */
const buildItem = (fields: ItemFields, id?: number): Item => {
    const item = new Item({
        ...fields,
        id,
        buyPrice: new Prisma.Decimal(toDecimal(fields.buyPrice).toFixed(2)),
        websiteCategory: trimToNull(fields.websiteCategory),
        websiteEmoji: trimToNull(fields.websiteEmoji),
        websiteSortOrder: fields.websiteSortOrder ?? 0,
        memberPrice: toWebsitePrice(fields.memberPrice, 'Member price'),
        nonMemberPrice: toWebsitePrice(fields.nonMemberPrice, 'Non-member price'),
        publishedToWebsite: fields.publishedToWebsite ?? false,
    });

    if (item.getPublishedToWebsite()) {
        if (!item.getWebsiteCategory()) {
            throw createError.badRequest('Website category is required when publishing an item');
        }
        if (!item.getMemberPrice() || !item.getNonMemberPrice()) {
            throw createError.badRequest('Member and non-member prices are required when publishing an item');
        }
    }
    return item;
};

const getItemById = async ({ id }: { id: number }): Promise<Item> => {
    const item = await itemDB.getItemById({ id });
    if (!item) throw createError.notFound('Item not found');
    return item;
};

const getItemsByInventoryId = ({ inventoryId }: { inventoryId: number }) =>
    itemDB.getItemsByInventoryId({ inventoryId });

const getItemsByInventoryIds = ({ inventoryIds }: { inventoryIds: number[] }) =>
    itemDB.getItemsByInventoryIds({ inventoryIds });

const createItem = async ({
    priceVariables = [],
    ...fields
}: ItemFields & { priceVariables?: PriceVariableInput[] }): Promise<Item> =>
    itemDB.createItem(
        buildItem(fields),
        priceVariables.map(({ isDefault = false, ...priceVariable }) => ({ ...priceVariable, isDefault })),
    );

/** Applies a partial update; fields left undefined keep their current value, null clears them. */
const updateItem = async ({ id, ...patch }: Partial<ItemFields> & { id: number }): Promise<Item> => {
    const existing = await getItemById({ id });
    const definedPatch = Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as Partial<ItemFields>;
    return itemDB.updateItem(buildItem({ ...existing.toFields(), ...definedPatch }, id));
};

const deleteItem = async ({ id }: { id: number }): Promise<void> => {
    await getItemById({ id });
    await itemDB.deleteItem({ id });
};

export default {
    getItemById,
    getItemsByInventoryId,
    getItemsByInventoryIds,
    createItem,
    updateItem,
    deleteItem,
};
