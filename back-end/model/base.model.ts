import { createError } from '../util/errors';

export abstract class BaseModel {
    protected id?: number;
    protected quantity: number;
    protected createdAt: Date;

    constructor(entity: { id?: number; quantity: number; createdAt?: Date }) {
        if (entity.quantity == null) throw createError.badRequest('Quantity is required');
        this.id = entity.id || 0;
        this.quantity = entity.quantity;
        this.createdAt = entity.createdAt || new Date();
    }

    getId(): number {
        if (this.id === undefined) throw new Error('Entity ID is undefined');
        return this.id;
    }

    getQuantity(): number {
        return this.quantity;
    }

    getCreatedAt(): Date {
        return this.createdAt;
    }

    protected abstract validate(entity: unknown): void;
}
