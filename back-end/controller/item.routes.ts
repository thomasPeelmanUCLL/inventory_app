import express, { NextFunction, Request, Response } from 'express';
import itemService from '../service/item.service';
import inventoryDB from '../repository/inventory.db';
import { requireAuth } from '../middleware/auth.middleware';
import { requireInventoryAccess } from '../middleware/authorization.middleware';
import { 
    validateParams, 
    validateBody, 
    idParam, 
    inventoryIdParam, 
    itemInput, 
    itemUpdateInput,
    asyncHandler 
} from '../util/validators';
import { createError } from '../middleware/error.middleware';
import { safeGetItemById } from '../util/safe';

const itemRouter = express.Router();

itemRouter.use(requireAuth);

itemRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const userInventories = await inventoryDB.getInventoriesByUserId({ userId: user.id });
    const inventoryIds = userInventories.map(inv => inv.getId());
    if (inventoryIds.length === 0) return res.status(200).json([]);
    // Use bulk method to avoid N+1
    const items = await itemService.getItemsByInventoryIds({ inventoryIds });
    res.status(200).json(items);
}));

itemRouter.get('/:id', 
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any; // validated
        const user = (req as any).user;
        const item = await safeGetItemById(Number(id));
        if (!item.getInventoryId()) throw createError.notFound('Item not found');
        const hasAccess = await inventoryDB.userHasAccess({ userId: user.id, inventoryId: item.getInventoryId()! });
        if (!hasAccess) throw createError.forbidden('Access denied to this item\'s inventory');
        res.status(200).json(item);
    })
);

itemRouter.get('/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params as any; // validated
        const items = await itemService.getItemsByInventoryId({ inventoryId: Number(inventoryId) });
        res.status(200).json(items);
    })
);

itemRouter.post('/',
    validateBody(itemInput),
    asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { inventoryId, ...itemData } = req.body;
        if (inventoryId) {
            const ok = await inventoryDB.userHasAccess({ userId: user.id, inventoryId });
            if (!ok) throw createError.forbidden('Access denied to this inventory');
        }
        const item = await itemService.createItem({ ...itemData, inventoryId });
        res.status(201).json(item);
    })
);

itemRouter.put('/:id',
    validateParams(idParam),
    validateBody(itemUpdateInput),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        const { inventoryId: newInventoryId, ...updateData } = req.body;
        const existing = await safeGetItemById(Number(id));
        if (existing.getInventoryId()) {
            const ok = await inventoryDB.userHasAccess({ userId: user.id, inventoryId: existing.getInventoryId()! });
            if (!ok) throw createError.forbidden('Access denied to this item\'s current inventory');
        }
        if (newInventoryId && newInventoryId !== existing.getInventoryId()) {
            const ok = await inventoryDB.userHasAccess({ userId: user.id, inventoryId: newInventoryId });
            if (!ok) throw createError.forbidden('Access denied to target inventory');
        }
        const item = await itemService.updateItem({ id: Number(id), ...updateData, inventoryId: newInventoryId });
        res.status(200).json(item);
    })
);

itemRouter.delete('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        const item = await safeGetItemById(Number(id));
        if (item.getInventoryId()) {
            const ok = await inventoryDB.userHasAccess({ userId: user.id, inventoryId: item.getInventoryId()! });
            if (!ok) throw createError.forbidden('Access denied to this item\'s inventory');
        }
        await itemService.deleteItem({ id: Number(id) });
        res.status(204).send();
    })
);

export { itemRouter };