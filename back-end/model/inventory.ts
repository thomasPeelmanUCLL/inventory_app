import {Inventory as InventoryPrisma} from '@prisma/client';

export class Inventory {
    private id?: number;
    private name: string;
    private description: string;


    constructor(inventory: {
        id?: number;
        name: string;
        description: string;
    }) {
        this.validate(inventory);

        this.id = inventory.id || 0;
        this.name = inventory.name;
        this.description = inventory.description;
    }

    getId(): number {
        if (this.id === undefined) {
            throw new Error('Inventory ID is undefined');
        }
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getDescription(): string {
        return this.description;
    }

    validate(inventory: {
        id?: number;
        name: string;
        description: string;
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

    }

    static from(inventoryPrisma: InventoryPrisma): Inventory {
        return new Inventory({
            id: inventoryPrisma.id,
            name: inventoryPrisma.name,
            description: inventoryPrisma.description,
        });
    }

}
