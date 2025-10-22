import {SoldItem as SoldItemPrisma} from '@prisma/client';
import {Item} from './item';
import { BaseModel } from './base.model';

export class SoldItem extends BaseModel {
    private itemId: number;
    private sellingPrice: number;
    private payedCash: boolean;
    private soldAt?: Date;

    constructor(soldItem: {
        id?: number;
        itemId: number;
        sellingPrice: number;
        payedCash: boolean;
        quantity: number;
        soldAt?: Date;
        createdAt?: Date;
    }) {
        super({
            id: soldItem.id,
            quantity: soldItem.quantity,
            createdAt: soldItem.createdAt
        });
        this.validate(soldItem);
        this.itemId = soldItem.itemId;
        this.sellingPrice = soldItem.sellingPrice;
        this.payedCash = soldItem.payedCash;
        this.soldAt = soldItem.soldAt;
    }

    getItemId(): number {
        return this.itemId;
    }

    getSellingPrice(): number {
        return this.sellingPrice;
    }

    isPayedCash(): boolean {
        return this.payedCash;
    }

    getSoldAt(): Date | undefined {
        return this.soldAt;
    }

    validate(soldItem: {
        id?: number;
        itemId: number;
        sellingPrice: number;
        payedCash: boolean;
        quantity: number;
        soldAt?: Date;
        createdAt?: Date;
    }) {
        if (!soldItem.itemId) {
            throw new Error('Item ID is required');
        }
        if (!soldItem.sellingPrice && soldItem.sellingPrice !== 0) {
            throw new Error('Selling price is required');
        }
        if (soldItem.sellingPrice < 0) {
            throw new Error('Selling price must be a positive number');
        }
        if (soldItem.payedCash === undefined || soldItem.payedCash === null) {
            throw new Error('Payed cash status is required');
        }
        if (soldItem.quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }
    }

    static from(soldItemPrisma: SoldItemPrisma): SoldItem {
        return new SoldItem({
            id: soldItemPrisma.id,
            itemId: soldItemPrisma.itemId,
            sellingPrice: soldItemPrisma.sellingPrice,
            payedCash: soldItemPrisma.payedCash,
            quantity: soldItemPrisma.quantity,
            soldAt: soldItemPrisma.soldAt || undefined,
            createdAt: soldItemPrisma.createdAt,
        });
    }
}
