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

const getPriceVariablesByInventoryId = async ({ inventoryId }: { inventoryId: number }): Promise<PriceVariable[]> => {
    return await priceVariableDB.getPriceVariablesByInventoryId({ inventoryId });
};

const createPriceVariable = async ({
                                       name,
                                       value,       // ← ADD THIS
                                       type,        // ← ADD THIS
                                       isDefault,   // ← ADD THIS
                                       inventoryId
                                   }: {
    name: string;
    value: number;        // ← ADD THIS
    type: string;         // ← ADD THIS
    isDefault: boolean;   // ← ADD THIS
    inventoryId: number;
}): Promise<PriceVariable> => {
    const existing = await priceVariableDB.getPriceVariableByName({ name, inventoryId });
    if (existing) {
        throw new Error(`Price variable with name "${name}" already exists for this inventory.`);
    }

    const priceVariable = new PriceVariable({ name, value, type, isDefault, inventoryId }); // ← UPDATE
    return await priceVariableDB.createPriceVariable(priceVariable);
};


const updatePriceVariable = async ({
                                       id,
                                       name,
                                       value,       // ← ADD THIS
                                       type,        // ← ADD THIS
                                       isDefault    // ← ADD THIS
                                   }: {
    id: number;
    name?: string;            // ← Make optional with ?
    value?: number;           // ← ADD THIS
    type?: string;            // ← ADD THIS
    isDefault?: boolean;      // ← ADD THIS
}): Promise<PriceVariable> => {
    const existingPriceVariable = await getPriceVariableById({ id });
    if (!existingPriceVariable) {
        throw new Error(`PriceVariable with ID: ${id} does not exist.`);
    }

    const result = await priceVariableDB.updatePriceVariable({ id, name, value, type, isDefault }); // ← UPDATE
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
    getPriceVariablesByInventoryId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
};
