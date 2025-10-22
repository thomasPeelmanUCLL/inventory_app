import {SoldItem as SoldItemPrisma} from '@prisma/client';
import {Item} from './item';
import { BaseModel } from './base.model';

export class SoldItem extends BaseModel {
    private itemId: number;
    private sellingPrice: number;
    private soldAt: Date;

    constructor(soldItem: {
        id?: number;
        itemId: number;
        sellingPrice: number;
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
        this.soldAt = soldItem.soldAt || new Date();
    }

    getItemId(): number {
        return this.itemId;
    }

    getSellingPrice(): number {
        return this.sellingPrice;
    }

    getSoldAt(): Date {
        return this.soldAt;
    }

    validate(soldItem: {
        id?: number;
        itemId: number;
        sellingPrice: number;
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
        if (soldItem.quantity <= 0) {
            throw new Error('Quantity must be a positive number');
        }
    }

    static from(soldItemPrisma: SoldItemPrisma): SoldItem {
        return new SoldItem({
            id: soldItemPrisma.id,
            itemId: soldItemPrisma.itemId,
            sellingPrice: soldItemPrisma.sellingPrice,
            quantity: soldItemPrisma.quantity,
            soldAt: soldItemPrisma.soldAt,
            createdAt: soldItemPrisma.createdAt,
        });
    }
}
