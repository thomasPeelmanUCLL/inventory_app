import { SoldItem as SoldItemPrisma, Prisma } from '@prisma/client';
import { BaseModel } from './base.model';
import { Item } from './item'; // ✅ Import Item model

export class SoldItem extends BaseModel {
    private itemId: number;
    private finalSellPrice: Prisma.Decimal;
    private priceVariableName?: string;
    private isCustomPrice: boolean;
    private payedCash: boolean;
    private soldAt: Date;
    private item?: Item; // ✅ ADD THIS - Optional item property

    constructor(soldItem: {
        id?: number;
        itemId: number;
        finalSellPrice: Prisma.Decimal | number;
        quantity: number;
        priceVariableName?: string;
        isCustomPrice?: boolean;
        payedCash: boolean;
        soldAt?: Date;
        createdAt?: Date;
        item?: any; // ✅ ADD THIS
    }) {
        super({
            id: soldItem.id,
            quantity: soldItem.quantity,
            createdAt: soldItem.createdAt,
        });
        this.validate(soldItem);
        this.itemId = soldItem.itemId;
        this.finalSellPrice =
            typeof soldItem.finalSellPrice === 'number'
                ? new Prisma.Decimal(soldItem.finalSellPrice)
                : soldItem.finalSellPrice;
        this.priceVariableName = soldItem.priceVariableName;
        this.isCustomPrice = soldItem.isCustomPrice ?? false;
        this.payedCash = soldItem.payedCash;
        this.soldAt = soldItem.soldAt || new Date();
        this.item = soldItem.item;
    }

    getItemId(): number {
        return this.itemId;
    }

    // ✅ ADD THIS METHOD
    getItem(): Item | undefined {
        return this.item;
    }

    getFinalSellPrice(): Prisma.Decimal {
        return this.finalSellPrice;
    }

    getFinalSellPriceAsNumber(): number {
        return this.finalSellPrice.toNumber();
    }

    getPriceVariableName(): string | undefined {
        return this.priceVariableName;
    }

    getIsCustomPrice(): boolean {
        return this.isCustomPrice;
    }

    isPayedCash(): boolean {
        return this.payedCash;
    }

    getSoldAt(): Date {
        return this.soldAt;
    }

    validate(soldItem: {
        id?: number;
        itemId: number;
        finalSellPrice: Prisma.Decimal | number;
        payedCash: boolean;
        quantity: number;
        soldAt?: Date;
        createdAt?: Date;
    }) {
        if (!soldItem.itemId) {
            throw new Error('Item ID is required');
        }

        if (soldItem.finalSellPrice === undefined || soldItem.finalSellPrice === null) {
            throw new Error('Final sell price is required');
        }

        const price =
            typeof soldItem.finalSellPrice === 'number'
                ? soldItem.finalSellPrice
                : soldItem.finalSellPrice.toNumber();

        console.log('🔍 Validating finalSellPrice:', soldItem.finalSellPrice);
        console.log('🔍 Converted price:', price);
        console.log('🔍 Is NaN?', isNaN(price));
        console.log('🔍 Type:', typeof price);

        if (isNaN(price) || price <= 0) {
            // Changed from < 0 to <= 0 AND added NaN check
            throw new Error(`Invalid finalSellPrice: must be a positive number`);
        }

        if (soldItem.payedCash === undefined || soldItem.payedCash === null) {
            throw new Error('Payed cash status is required');
        }

        if (soldItem.quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }
    }

    static from(soldItemPrisma: SoldItemPrisma & { item?: any }): SoldItem {
        return new SoldItem({
            id: soldItemPrisma.id,
            itemId: soldItemPrisma.itemId,
            finalSellPrice: soldItemPrisma.finalSellPrice,
            quantity: soldItemPrisma.quantity,
            priceVariableName: soldItemPrisma.priceVariableName || undefined,
            isCustomPrice: soldItemPrisma.isCustomPrice,
            payedCash: soldItemPrisma.payedCash,
            soldAt: soldItemPrisma.soldAt,
            createdAt: soldItemPrisma.soldAt, // Using soldAt as createdAt for SoldItem
            item: soldItemPrisma.item,
        });
    }
}
