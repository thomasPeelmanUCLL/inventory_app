import {Item as ItemPrisma} from '@prisma/client';
import { BaseModel } from './base.model';

export class Item extends BaseModel {
    private name: string;
    private description: string;
    private price: number;
    private buyedAt?: Date;
    private inventoryId?: number;

    constructor(item: {
        id?: number;
        name: string;
        description: string;
        price: number;
        quantity: number;
        buyedAt?: Date;
        createdAt?: Date;
        inventoryId?: number;
    }) {
        super({
            id: item.id,
            quantity: item.quantity,
            createdAt: item.createdAt
        });
        this.validate(item);
        this.name = item.name;
        this.description = item.description;
        this.price = item.price;
        this.buyedAt = item.buyedAt;
        this.inventoryId = item.inventoryId;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getPrice(): number {
        return this.price;
    }

    getBuyedAt(): Date | undefined {
        return this.buyedAt;
    }

    getInventoryId(): number | undefined {
        return this.inventoryId;
    }

    validate(inventory: {
        id?: number;
        name: string;
        description: string;
        price: number;
        quantity: number;
        buyedAt?: Date;
        createdAt?: Date;
    }) {
        if (!inventory.name) {
            throw new Error('Name is required');
        }
        if (inventory.name.length < 3) {
            throw new Error('Name must be at least 3 characters long');
        }
        if (!inventory.description) {
            throw new Error('Description is required');
        }
        if (!inventory.price) {
            throw new Error('Price is required');
        }
        if (inventory.price < 0) {
            throw new Error('Price must be a positive number');
        }
    }

    static from(itemPrisma: ItemPrisma): Item {
        return new Item({
            id: itemPrisma.id,
            name: itemPrisma.name,
            description: itemPrisma.description,
            price: itemPrisma.price,
            quantity: itemPrisma.quantity,
            buyedAt: itemPrisma.buyedAt || undefined,
            createdAt: itemPrisma.createdAt,
            inventoryId: itemPrisma.inventoryId || undefined,
        });
    }

}
