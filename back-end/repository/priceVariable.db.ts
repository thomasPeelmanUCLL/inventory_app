import { PrismaClient } from '@prisma/client';
import { PriceVariable } from '../model/priceVariable';

const prisma = new PrismaClient();

const getAllPriceVariables = async (): Promise<PriceVariable[]> => {
    const priceVariables = await prisma.priceVariable.findMany();
    return priceVariables.map((pv) => PriceVariable.from(pv));
};

const getPriceVariableById = async ({ id }: { id: number }): Promise<PriceVariable | null> => {
    const priceVariablePrisma = await prisma.priceVariable.findUnique({
        where: { id },
    });
    return priceVariablePrisma ? PriceVariable.from(priceVariablePrisma) : null;
};

const getPriceVariablesByInventoryId = async ({ inventoryId }: { inventoryId: number }): Promise<PriceVariable[]> => {
    const priceVariables = await prisma.priceVariable.findMany({
        where: { inventoryId },
    });
    return priceVariables.map((pv) => PriceVariable.from(pv));
};

const getPriceVariableByName = async ({
                                          name,
                                          inventoryId
                                      }: {
    name: string;
    inventoryId: number
}): Promise<PriceVariable | null> => {
    const priceVariablePrisma = await prisma.priceVariable.findUnique({
        where: {
            name_inventoryId: {
                name,
                inventoryId
            }
        },
    });
    return priceVariablePrisma ? PriceVariable.from(priceVariablePrisma) : null;
};

const createPriceVariable = async (priceVariable: PriceVariable): Promise<PriceVariable> => {
    const priceVariablePrisma = await prisma.priceVariable.create({
        data: {
            name: priceVariable.getName(),
            value: priceVariable.getValue(),           // ← ADD THIS
            type: priceVariable.getType(),             // ← ADD THIS
            isDefault: priceVariable.getIsDefault(),   // ← ADD THIS
            inventoryId: priceVariable.getInventoryId(),
        },
    });
    return PriceVariable.from(priceVariablePrisma);
};

const updatePriceVariable = async ({
                                       id,
                                       name,
                                       value,       // ← ADD THIS
                                       type,        // ← ADD THIS
                                       isDefault,   // ← ADD THIS
                                   }: {
    id: number;
    name?: string;            // ← Make optional
    value?: number;           // ← ADD THIS
    type?: string;            // ← ADD THIS
    isDefault?: boolean;      // ← ADD THIS
}): Promise<PriceVariable> => {
    const priceVariablePrisma = await prisma.priceVariable.update({
        where: { id },
        data: {
            ...(name !== undefined && { name }),           // Only update if provided
            ...(value !== undefined && { value }),         // ← ADD THIS
            ...(type !== undefined && { type }),           // ← ADD THIS
            ...(isDefault !== undefined && { isDefault }), // ← ADD THIS
        },
    });
    return PriceVariable.from(priceVariablePrisma);
};


const deletePriceVariable = async ({ id }: { id: number }): Promise<void> => {
    await prisma.priceVariable.delete({
        where: { id },
    });
};

export default {
    getAllPriceVariables,
    getPriceVariableById,
    getPriceVariablesByInventoryId,
    getPriceVariableByName,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable,
};
