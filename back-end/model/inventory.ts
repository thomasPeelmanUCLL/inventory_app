import {
    Inventory as InventoryPrisma,
    InventoryUser as InventoryUserPrisma,
    Item as ItemPrisma,
    PriceVariable as PriceVariablePrisma,
    User as UserPrisma,
} from '@prisma/client';
import { Item } from './item';
import { createError } from '../util/errors';

export type InventoryMember = InventoryUserPrisma & { user: Pick<UserPrisma, 'id' | 'name' | 'email'> };

type InventoryPrismaWithRelations = InventoryPrisma & {
    items?: Array<ItemPrisma & { priceVariables?: PriceVariablePrisma[] }>;
    users?: InventoryMember[];
};

export class Inventory {
    private id: number;
    private name: string;
    private description: string;
    private createdAt?: Date;
    private items: Item[];
    private users: InventoryMember[];

    constructor(inventory: {
        id?: number;
        name: string;
        description: string;
        createdAt?: Date;
        items?: Item[];
        users?: InventoryMember[];
    }) {
        this.validate(inventory);
        this.id = inventory.id || 0;
        this.name = inventory.name;
        this.description = inventory.description;
        this.createdAt = inventory.createdAt;
        this.items = inventory.items ?? [];
        this.users = inventory.users ?? [];
    }

    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    getCreatedAt(): Date | undefined {
        return this.createdAt;
    }

    getItems(): Item[] {
        return this.items;
    }

    getUsers(): InventoryMember[] {
        return this.users;
    }

    private validate(inventory: { name: string; description: string }) {
        if (!inventory.name) throw createError.badRequest('Name is required');
        if (inventory.name.length < 3) throw createError.badRequest('Name must be at least 3 characters long');
        if (!inventory.description) throw createError.badRequest('Description is required');
    }

    static from(inventoryPrisma: InventoryPrismaWithRelations): Inventory {
        return new Inventory({
            ...inventoryPrisma,
            items: inventoryPrisma.items?.map(Item.from),
        });
    }
}
