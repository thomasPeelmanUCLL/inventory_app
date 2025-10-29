import express, { NextFunction, Request, Response } from 'express';
import soldItemDB from '../repository/soldItem.db';
import inventoryDB from '../repository/inventory.db';
import { requireAuth } from '../middleware/auth.middleware';
import { requireInventoryAccess } from '../middleware/authorization.middleware';
import { 
    validateParams, 
    validateBody,
    validateQuery, 
    idParam, 
    inventoryIdParam,
    itemIdParam,
    soldItemInput, 
    soldItemUpdateInput,
    analyticsQuery,
    asyncHandler 
} from '../util/validators';
import { createError } from '../middleware/error.middleware';
import { SoldItem } from '../model/soldItem';
import { safeGetSoldItemById } from '../util/safe';

const soldItemRouter = express.Router();

// Apply auth middleware to all sold item routes
soldItemRouter.use(requireAuth);

// List sold items user has access to (bulk query)
soldItemRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const userInventories = await inventoryDB.getInventoriesByUserId({ userId: user.id });
    const inventoryIds = userInventories.map(inv => inv.getId());
    if (inventoryIds.length === 0) return res.status(200).json([]);
    const soldItems = await soldItemDB.getSoldItemsByInventoryIds({ inventoryIds });
    res.status(200).json(soldItems);
}));

// Get sold item by id with standardized not-found
soldItemRouter.get('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        const soldItem = await safeGetSoldItemById(Number(id));
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: soldItem.getItemId() });
        if (!hasAccess) throw createError.forbidden('Access denied to this sold item\'s inventory');
        res.status(200).json(soldItem);
    })
);

// Other handlers remain same as previous security-fixes with numeric coercion and transactional calls...

export { soldItemRouter };