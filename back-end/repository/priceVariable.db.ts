import database from './database';
import { PriceVariable } from '../model/priceVariable';

type PriceVariablePatch = Partial<{ name: string; value: number; type: string; isDefault: boolean }>;

const getPriceVariableById = async ({ id }: { id: number }): Promise<PriceVariable | null> => {
    const priceVariable = await database.priceVariable.findUnique({ where: { id } });
    return priceVariable ? PriceVariable.from(priceVariable) : null;
};

const getPriceVariablesByItemId = async ({ itemId }: { itemId: number }): Promise<PriceVariable[]> => {
    const priceVariables = await database.priceVariable.findMany({ where: { itemId } });
    return priceVariables.map(PriceVariable.from);
};

const createPriceVariable = async (priceVariable: PriceVariable): Promise<PriceVariable> => {
    const created = await database.priceVariable.create({
        data: {
            name: priceVariable.getName(),
            value: priceVariable.getValue(),
            type: priceVariable.getType(),
            isDefault: priceVariable.getIsDefault(),
            itemId: priceVariable.getItemId(),
        },
    });
    return PriceVariable.from(created);
};

const updatePriceVariable = async (id: number, patch: PriceVariablePatch): Promise<PriceVariable> => {
    const updated = await database.priceVariable.update({ where: { id }, data: patch });
    return PriceVariable.from(updated);
};

const deletePriceVariable = async ({ id }: { id: number }): Promise<void> => {
    await database.priceVariable.delete({ where: { id } });
};

export default {
    getPriceVariableById,
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
};
