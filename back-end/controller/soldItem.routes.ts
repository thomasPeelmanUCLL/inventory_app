import express, { NextFunction, Request, Response } from 'express';
import soldItemService from '../service/soldItem.service';
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
import { soldItemToDTO, soldItemsToDTO, analyticsToDTO } from '../dto/soldItem.dto';
import { safeGetSoldItemById } from '../util/safe';
import { SoldItem } from '../model/soldItem';

const soldItemRouter = express.Router();

// Apply auth middleware to all sold item routes
soldItemRouter.use(requireAuth);

// List all sold items user has access to (uses bulk query)
soldItemRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    const userInventories = await inventoryDB.getInventoriesByUserId({ userId: user.id });
    const inventoryIds = userInventories.map(inv => inv.getId());
    if (inventoryIds.length === 0) return res.status(200).json([]);
    
    const soldItems = await soldItemDB.getSoldItemsByInventoryIds({ inventoryIds });
    res.status(200).json(soldItemsToDTO(soldItems, true));
}));

// Get sold items by inventory ID — static path, must be before /:id
soldItemRouter.get('/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params as any;
        const soldItems = await soldItemService.getSoldItemsByInventoryId({ inventoryId: Number(inventoryId) });
        res.status(200).json(soldItemsToDTO(soldItems, true));
    })
);

// Analytics endpoint — static path, must be before /:id
soldItemRouter.get('/inventory/:inventoryId/analytics',
    validateParams(inventoryIdParam),
    validateQuery(analyticsQuery),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params as any;
        const { startDate, endDate } = req.query as any;
        
        const analytics = await soldItemService.getAnalyticsByInventoryId({
            inventoryId: Number(inventoryId),
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        
        res.status(200).json(analyticsToDTO(analytics));
    })
);

// Get sold items by item ID — static path, must be before /:id
soldItemRouter.get('/item/:itemId',
    validateParams(itemIdParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { itemId } = req.params as any;
        const user = (req as any).user;
        
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: Number(itemId) });
        if (!hasAccess) throw createError.forbidden('Access denied to this item\'s inventory');
        
        const soldItems = await soldItemService.getSoldItemsByItemId({ itemId: Number(itemId) });
        res.status(200).json(soldItemsToDTO(soldItems, true));
    })
);

// Get sold item by ID — catch-all, must be last GET
soldItemRouter.get('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        const soldItem = await safeGetSoldItemById(Number(id));
        
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: soldItem.getItemId() });
        if (!hasAccess) throw createError.forbidden('Access denied to this sold item\'s inventory');
        
        res.status(200).json(soldItemToDTO(soldItem, true));
    })
);

// Create sold item (transactional)
soldItemRouter.post('/',
    validateBody(soldItemInput),
    asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const data = req.body;
        
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: data.itemId });
        if (!hasAccess) throw createError.forbidden('Access denied to this item\'s inventory');
        
        const created = await soldItemDB.createSoldItemWithStockUpdate({
            itemId: data.itemId,
            finalSellPrice: data.finalSellPrice,
            quantity: data.quantity,
            priceVariableName: data.priceVariableName,
            isCustomPrice: data.isCustomPrice,
            payedCash: data.payedCash,
            soldAt: data.soldAt ? new Date(data.soldAt) : undefined,
        });
        
        res.status(201).json(soldItemToDTO(SoldItem.from(created), true));
    })
);

// Update sold item (transactional)
soldItemRouter.put('/:id',
    validateParams(idParam),
    validateBody(soldItemUpdateInput),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        const data = req.body;
        
        const existing = await safeGetSoldItemById(Number(id));
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: existing.getItemId() });
        if (!hasAccess) throw createError.forbidden('Access denied to this sold item\'s inventory');
        
        const updated = await soldItemDB.updateSoldItemWithStockAdjustment(Number(id), {
            finalSellPrice: data.finalSellPrice,
            quantity: data.quantity,
            priceVariableName: data.priceVariableName,
            isCustomPrice: data.isCustomPrice,
            payedCash: data.payedCash,
            soldAt: data.soldAt ? new Date(data.soldAt) : undefined,
        });
        
        res.status(200).json(soldItemToDTO(SoldItem.from(updated), true));
    })
);

// Delete sold item (transactional)
soldItemRouter.delete('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params as any;
        const user = (req as any).user;
        
        const existing = await safeGetSoldItemById(Number(id));
        const hasAccess = await inventoryDB.userHasAccessViaItem({ userId: user.id, itemId: existing.getItemId() });
        if (!hasAccess) throw createError.forbidden('Access denied to this sold item\'s inventory');
        
        await soldItemDB.deleteSoldItemWithStockRestore(Number(id));
        res.status(204).send();
    })
);

export { soldItemRouter };
