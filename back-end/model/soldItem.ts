import { SoldItem as SoldItemPrisma, Item as ItemPrisma, PaymentMethod, Prisma } from '@prisma/client';
import { BaseModel } from './base.model';
import { Item, Money, toDecimal } from './item';
import { createError } from '../util/errors';

type SoldItemFields = {
    id?: number;
    itemId: number;
    finalSellPrice: Money;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    paymentMethod: PaymentMethod;
    soldAt?: Date;
    item?: Item;
};

export class SoldItem extends BaseModel {
    private itemId: number;
    private finalSellPrice: Prisma.Decimal;
    private priceVariableName?: string;
    private isCustomPrice: boolean;
    private paymentMethod: PaymentMethod;
    private soldAt: Date;
    private item?: Item;

    constructor(soldItem: SoldItemFields) {
        // A sale has no separate creation time; soldAt doubles as createdAt
        super({ id: soldItem.id, quantity: soldItem.quantity, createdAt: soldItem.soldAt });
        this.validate(soldItem);
        this.itemId = soldItem.itemId;
        this.finalSellPrice = toDecimal(soldItem.finalSellPrice);
        this.priceVariableName = soldItem.priceVariableName;
        this.isCustomPrice = soldItem.isCustomPrice ?? false;
        this.paymentMethod = soldItem.paymentMethod;
        this.soldAt = soldItem.soldAt || new Date();
        this.item = soldItem.item;
    }

    getItemId(): number {
        return this.itemId;
    }

    getItem(): Item | undefined {
        return this.item;
    }

    getFinalSellPrice(): Prisma.Decimal {
        return this.finalSellPrice;
    }

    getPriceVariableName(): string | undefined {
        return this.priceVariableName;
    }

    getIsCustomPrice(): boolean {
        return this.isCustomPrice;
    }

    getPaymentMethod(): PaymentMethod {
        return this.paymentMethod;
    }

    getSoldAt(): Date {
        return this.soldAt;
    }

    protected validate(soldItem: SoldItemFields) {
        if (!soldItem.itemId) throw createError.badRequest('Item ID is required');
        if (soldItem.finalSellPrice == null) throw createError.badRequest('Final sell price is required');
        const price = toDecimal(soldItem.finalSellPrice);
        if (price.isNaN() || price.lessThanOrEqualTo(0)) {
            throw createError.badRequest('Invalid finalSellPrice: must be a positive number');
        }
        if (!soldItem.paymentMethod) throw createError.badRequest('Payment method is required');
        if (soldItem.quantity <= 0) throw createError.badRequest('Quantity must be a positive number');
    }

    static from(soldItemPrisma: SoldItemPrisma & { item?: ItemPrisma }): SoldItem {
        return new SoldItem({
            ...soldItemPrisma,
            priceVariableName: soldItemPrisma.priceVariableName ?? undefined,
            item: soldItemPrisma.item ? Item.from(soldItemPrisma.item) : undefined,
        });
    }
}
