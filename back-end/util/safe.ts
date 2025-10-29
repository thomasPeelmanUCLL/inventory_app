import itemService from '../service/item.service';
import soldItemDB from '../repository/soldItem.db';
import inventoryDB from '../repository/inventory.db';
import { AppError, createError } from '../middleware/error.middleware';

// Wrap service calls that may throw and normalize not-found to AppError
export async function safeGetItemById(id: number) {
    try {
        return await itemService.getItemById({ id });
    } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.includes('does not exist')) {
            throw createError.notFound('Item not found');
        }
        throw e;
    }
}

export async function safeGetSoldItemById(id: number) {
    try {
        const s = await soldItemDB.getSoldItemById({ id });
        if (!s) throw createError.notFound('Sold item not found');
        return s;
    } catch (e: any) {
        throw e;
    }
}

export async function ensureInventoryAccess(userId: string, inventoryId: number) {
    const hasAccess = await inventoryDB.userHasAccess({ userId, inventoryId });
    if (!hasAccess) throw createError.forbidden('Access denied to this inventory');
}
