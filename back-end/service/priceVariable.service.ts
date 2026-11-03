import priceVariableDB from '../repository/priceVariable.db';
import { PriceVariable } from '../model/priceVariable';
import { createError } from '../util/errors';
import { requireItemRole } from './access.service';

type PriceVariableFields = { name: string; value: number; type: string; isDefault: boolean };

/** Loads a price variable and checks the user may act on its item's inventory. */
const getAuthorized = async (id: number, userId: string, level: 'read' | 'write') => {
    const priceVariable = await priceVariableDB.getPriceVariableById({ id });
    if (!priceVariable) throw createError.notFound('Price variable not found');
    await requireItemRole(userId, priceVariable.getItemId(), level);
    return priceVariable;
};

const getPriceVariableById = (id: number, userId: string) => getAuthorized(id, userId, 'read');

const getPriceVariablesByItemId = async (itemId: number, userId: string) => {
    await requireItemRole(userId, itemId, 'read');
    return priceVariableDB.getPriceVariablesByItemId({ itemId });
};

const createPriceVariable = async (
    data: PriceVariableFields & { itemId: number },
    userId: string,
): Promise<PriceVariable> => {
    await requireItemRole(userId, data.itemId, 'write');
    // A duplicate (name, itemId) hits the unique index and comes back as a 409
    return priceVariableDB.createPriceVariable(new PriceVariable(data));
};

const updatePriceVariable = async (id: number, patch: Partial<PriceVariableFields>, userId: string) => {
    const existing = await getAuthorized(id, userId, 'write');
    // Run the merged result through the model so updates obey the same rules as creates
    new PriceVariable({
        name: patch.name ?? existing.getName(),
        value: patch.value ?? existing.getValue(),
        type: patch.type ?? existing.getType(),
        isDefault: patch.isDefault ?? existing.getIsDefault(),
        itemId: existing.getItemId(),
    });
    return priceVariableDB.updatePriceVariable(id, patch);
};

const deletePriceVariable = async (id: number, userId: string): Promise<void> => {
    await getAuthorized(id, userId, 'write');
    await priceVariableDB.deletePriceVariable({ id });
};

export default {
    getPriceVariableById,
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
};
