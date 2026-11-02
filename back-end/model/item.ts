import { Item as ItemPrisma, Prisma, PriceVariable as PriceVariablePrisma } from '@prisma/client';
import { BaseModel } from './base.model';
import { PriceVariable } from './priceVariable';
import { createError } from '../util/errors';

export type Money = Prisma.Decimal | number;

export const toDecimal = (value: Money): Prisma.Decimal =>
    typeof value === 'number' ? new Prisma.Decimal(value) : value;

const toNullableDecimal = (value: Money | null | undefined): Prisma.Decimal | null =>
    value == null ? null : toDecimal(value);

/** Everything an item is made of, minus identity and relations. */
export type ItemFields = {
    name: string;
    description: string;
    buyPrice: Money;
    quantity: number;
    buyedAt?: Date;
    inventoryId?: number;
    websiteCategory?: string | null;
    websiteEmoji?: string | null;
    websiteSortOrder?: number;
    memberPrice?: Money | null;
    nonMemberPrice?: Money | null;
    publishedToWebsite?: boolean;
};

export class Item extends BaseModel {
    private name: string;
    private description: string;
    private buyPrice: Prisma.Decimal;
    private buyedAt?: Date;
    private inventoryId?: number;
    private websiteCategory: string | null;
    private websiteEmoji: string | null;
    private websiteSortOrder: number;
    private memberPrice: Prisma.Decimal | null;
    private nonMemberPrice: Prisma.Decimal | null;
    private publishedToWebsite: boolean;
    private priceVariables?: PriceVariable[];

    constructor(
        item: ItemFields & { id?: number; createdAt?: Date; priceVariables?: PriceVariable[] },
    ) {
        super({ id: item.id, quantity: item.quantity, createdAt: item.createdAt });
        this.validate(item);
        this.name = item.name;
        this.description = item.description;
        this.buyPrice = toDecimal(item.buyPrice);
        this.buyedAt = item.buyedAt;
        this.inventoryId = item.inventoryId;
        this.websiteCategory = item.websiteCategory ?? null;
        this.websiteEmoji = item.websiteEmoji ?? null;
        this.websiteSortOrder = item.websiteSortOrder ?? 0;
        this.memberPrice = toNullableDecimal(item.memberPrice);
        this.nonMemberPrice = toNullableDecimal(item.nonMemberPrice);
        this.publishedToWebsite = item.publishedToWebsite ?? false;
        this.priceVariables = item.priceVariables;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getBuyPrice(): Prisma.Decimal {
        return this.buyPrice;
    }

    getBuyedAt(): Date | undefined {
        return this.buyedAt;
    }

    getInventoryId(): number | undefined {
        return this.inventoryId;
    }

    getPriceVariables(): PriceVariable[] | undefined {
        return this.priceVariables;
    }

    getWebsiteCategory(): string | null {
        return this.websiteCategory;
    }

    getWebsiteEmoji(): string | null {
        return this.websiteEmoji;
    }

    getWebsiteSortOrder(): number {
        return this.websiteSortOrder;
    }

    getMemberPrice(): Prisma.Decimal | null {
        return this.memberPrice;
    }

    getNonMemberPrice(): Prisma.Decimal | null {
        return this.nonMemberPrice;
    }

    getPublishedToWebsite(): boolean {
        return this.publishedToWebsite;
    }

    /** The editable fields, e.g. to merge a partial update onto. */
    toFields(): ItemFields {
        return {
            name: this.name,
            description: this.description,
            buyPrice: this.buyPrice,
            quantity: this.quantity,
            buyedAt: this.buyedAt,
            inventoryId: this.inventoryId,
            websiteCategory: this.websiteCategory,
            websiteEmoji: this.websiteEmoji,
            websiteSortOrder: this.websiteSortOrder,
            memberPrice: this.memberPrice,
            nonMemberPrice: this.nonMemberPrice,
            publishedToWebsite: this.publishedToWebsite,
        };
    }

    protected validate(item: ItemFields) {
        if (!item.name) throw createError.badRequest('Name is required');
        if (item.name.length < 3) throw createError.badRequest('Name must be at least 3 characters long');
        if (!item.description) throw createError.badRequest('Description is required');
        if (item.buyPrice == null) throw createError.badRequest('Buy price is required');
        if (toDecimal(item.buyPrice).isNegative()) {
            throw createError.badRequest('Buy price must be a positive number');
        }
        if (item.quantity < 0) throw createError.badRequest('Quantity cannot be negative');
        if (item.websiteSortOrder !== undefined && !Number.isInteger(item.websiteSortOrder)) {
            throw createError.badRequest('Website sort order must be an integer');
        }
    }

    static from(itemPrisma: ItemPrisma & { priceVariables?: PriceVariablePrisma[] }): Item {
        return new Item({
            ...itemPrisma,
            buyedAt: itemPrisma.buyedAt ?? undefined,
            inventoryId: itemPrisma.inventoryId ?? undefined,
            priceVariables: itemPrisma.priceVariables?.map(PriceVariable.from),
        });
    }
}
