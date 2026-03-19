import priceVariableDB from '../repository/priceVariable.db';
import { PriceVariable } from '../model/priceVariable';

const getAllPriceVariables = async (): Promise<PriceVariable[]> => {
    return await priceVariableDB.getAllPriceVariables();
};

const getPriceVariableById = async ({ id }: { id: number }): Promise<PriceVariable> => {
    const priceVariable = await priceVariableDB.getPriceVariableById({ id });
    if (!priceVariable) {
        throw new Error(`PriceVariable with ID: ${id} does not exist.`);
    }
    return priceVariable;
};

const getPriceVariablesByItemId = async ({
    itemId,
}: {
    itemId: number;
}): Promise<PriceVariable[]> => {
    return await priceVariableDB.getPriceVariablesByItemId({ itemId });
};

const createPriceVariable = async ({
    name,
    value,
    type,
    isDefault,
    itemId,
}: {
    name: string;
    value: number;
    type: string;
    isDefault: boolean;
    itemId: number;
}): Promise<PriceVariable> => {
    const existing = await priceVariableDB.getPriceVariableByName({ name, itemId });
    if (existing) {
        throw new Error(`Price variable with name "${name}" already exists for this item.`);
    }

    const priceVariable = new PriceVariable({ name, value, type, isDefault, itemId });
    return await priceVariableDB.createPriceVariable(priceVariable);
};

const updatePriceVariable = async ({
    id,
    name,
    value,
    type,
    isDefault,
}: {
    id: number;
    name?: string;
    value?: number;
    type?: string;
    isDefault?: boolean;
}): Promise<PriceVariable> => {
    const existingPriceVariable = await getPriceVariableById({ id });
    if (!existingPriceVariable) {
        throw new Error(`PriceVariable with ID: ${id} does not exist.`);
    }

    const result = await priceVariableDB.updatePriceVariable({ id, name, value, type, isDefault });
    return result;
};

const deletePriceVariable = async ({ id }: { id: number }): Promise<void> => {
    const priceVariable = await getPriceVariableById({ id });
    if (!priceVariable) {
        throw new Error(`PriceVariable with ID: ${id} does not exist.`);
    }
    await priceVariableDB.deletePriceVariable({ id });
};

export default {
    getAllPriceVariables,
    getPriceVariableById,
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
};
