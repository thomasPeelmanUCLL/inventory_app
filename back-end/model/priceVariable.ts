import { PriceVariable as PriceVariablePrisma } from '@prisma/client';
import { createError } from '../util/errors';

export const PRICE_VARIABLE_TYPES = ['PERCENTAGE', 'FIXED'] as const;

type PriceVariableFields = {
    id?: number;
    name: string;
    value: number;
    type: string;
    isDefault: boolean;
    itemId: number;
};

export class PriceVariable {
    private id?: number;
    private name: string;
    private value: number;
    private type: string;
    private isDefault: boolean;
    private itemId: number;

    constructor(priceVariable: PriceVariableFields) {
        this.validate(priceVariable);
        this.id = priceVariable.id;
        this.name = priceVariable.name;
        this.value = priceVariable.value;
        this.type = priceVariable.type;
        this.isDefault = priceVariable.isDefault;
        this.itemId = priceVariable.itemId;
    }

    getId(): number {
        if (this.id === undefined) throw new Error('PriceVariable ID is undefined');
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    getValue(): number {
        return this.value;
    }

    getType(): string {
        return this.type;
    }

    getIsDefault(): boolean {
        return this.isDefault;
    }

    getItemId(): number {
        return this.itemId;
    }

    private validate(priceVariable: PriceVariableFields) {
        if (!priceVariable.name?.trim()) throw createError.badRequest('Price variable name is required');
        if (priceVariable.name.length < 2) {
            throw createError.badRequest('Price variable name must be at least 2 characters long');
        }
        if (priceVariable.value == null) throw createError.badRequest('Value is required');
        if (!(PRICE_VARIABLE_TYPES as readonly string[]).includes(priceVariable.type)) {
            throw createError.badRequest('Type must be either PERCENTAGE or FIXED');
        }
        if (!priceVariable.itemId) throw createError.badRequest('Item ID is required');
    }

    static from(priceVariablePrisma: PriceVariablePrisma): PriceVariable {
        return new PriceVariable(priceVariablePrisma);
    }
}
