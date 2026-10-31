import { Item as ItemPrisma, Prisma, PriceVariable as PriceVariablePrisma } from '@prisma/client';
import { BaseModel } from './base.model';
import { PriceVariable } from './priceVariable';

export class Item extends BaseModel {
    private name: string;
    private description: string;
    private buyPrice: Prisma.Decimal;
    private buyedAt?: Date;
    private inventoryId?: number;
    private websiteCategory?: string | null;
    private websiteEmoji?: string | null;
    private websiteSortOrder: number;
    private memberPrice?: Prisma.Decimal | null;
    private nonMemberPrice?: Prisma.Decimal | null;
    private publishedToWebsite: boolean;
    private priceVariables?: PriceVariable[];

    constructor(item: {
        id?: number;
        name: string;
        description: string;
        buyPrice: Prisma.Decimal | number;
        quantity: number;
        buyedAt?: Date;
        createdAt?: Date;
        inventoryId?: number;
        websiteCategory?: string | null;
        websiteEmoji?: string | null;
        websiteSortOrder?: number;
        memberPrice?: Prisma.Decimal | number | null;
        nonMemberPrice?: Prisma.Decimal | number | null;
        publishedToWebsite?: boolean;
        priceVariables?: PriceVariable[];
    }) {
        super({
            id: item.id,
            quantity: item.quantity,
            createdAt: item.createdAt,
        });
        this.validate(item);
        this.name = item.name;
        this.description = item.description;
        this.buyPrice =
            typeof item.buyPrice === 'number' ? new Prisma.Decimal(item.buyPrice) : item.buyPrice;
        this.buyedAt = item.buyedAt;
        this.inventoryId = item.inventoryId;
        this.websiteCategory = item.websiteCategory ?? null;
        this.websiteEmoji = item.websiteEmoji ?? null;
        this.websiteSortOrder = item.websiteSortOrder ?? 0;
        this.memberPrice =
            item.memberPrice === undefined || item.memberPrice === null
                ? null
                : typeof item.memberPrice === 'number'
                  ? new Prisma.Decimal(item.memberPrice)
                  : item.memberPrice;
        this.nonMemberPrice =
            item.nonMemberPrice === undefined || item.nonMemberPrice === null
                ? null
                : typeof item.nonMemberPrice === 'number'
                  ? new Prisma.Decimal(item.nonMemberPrice)
                  : item.nonMemberPrice;
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

    getBuyPriceAsNumber(): number {
        return this.buyPrice.toNumber();
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

    getWebsiteCategory(): string | null | undefined {
        return this.websiteCategory;
    }

    getWebsiteEmoji(): string | null | undefined {
        return this.websiteEmoji;
    }

    getWebsiteSortOrder(): number {
        return this.websiteSortOrder;
    }

    getMemberPrice(): Prisma.Decimal | null | undefined {
        return this.memberPrice;
    }

    getNonMemberPrice(): Prisma.Decimal | null | undefined {
        return this.nonMemberPrice;
    }

    getPublishedToWebsite(): boolean {
        return this.publishedToWebsite;
    }

    validate(item: {
        id?: number;
        name: string;
        description: string;
        buyPrice: Prisma.Decimal | number;
        quantity: number;
        buyedAt?: Date;
        createdAt?: Date;
        websiteSortOrder?: number;
    }) {
        if (!item.name) {
            throw new Error('Name is required');
        }
        if (item.name.length < 3) {
            throw new Error('Name must be at least 3 characters long');
        }
        if (!item.description) {
            throw new Error('Description is required');
        }
        if (item.buyPrice === undefined || item.buyPrice === null) {
            throw new Error('Buy price is required');
        }
        const price = typeof item.buyPrice === 'number' ? item.buyPrice : item.buyPrice.toNumber();
        if (price < 0) {
            throw new Error('Buy price must be a positive number');
        }
        if (
            item.websiteSortOrder !== undefined &&
            !Number.isInteger(item.websiteSortOrder)
        ) {
            throw new Error('Website sort order must be an integer');
        }
    }

    static from(itemPrisma: ItemPrisma & { priceVariables?: PriceVariablePrisma[] }): Item {
        return new Item({
            id: itemPrisma.id,
            name: itemPrisma.name,
            description: itemPrisma.description,
            buyPrice: itemPrisma.buyPrice,
            quantity: itemPrisma.quantity,
            buyedAt: itemPrisma.buyedAt || undefined,
            createdAt: itemPrisma.createdAt,
            inventoryId: itemPrisma.inventoryId || undefined,
            websiteCategory: itemPrisma.websiteCategory,
            websiteEmoji: itemPrisma.websiteEmoji,
            websiteSortOrder: itemPrisma.websiteSortOrder,
            memberPrice: itemPrisma.memberPrice,
            nonMemberPrice: itemPrisma.nonMemberPrice,
            publishedToWebsite: itemPrisma.publishedToWebsite,
            priceVariables: itemPrisma.priceVariables?.map((pv) => PriceVariable.from(pv)),
        });
    }
}
