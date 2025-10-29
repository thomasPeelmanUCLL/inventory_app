/**
 * @swagger
 * components:
 *   schemas:
 *     SoldItem:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           format: int64
 *         itemId:
 *           type: number
 *           format: int64
 *         finalSellPrice:
 *           type: number
 *           format: decimal
 *           description: Final price after applying price variable or custom price
 *         priceVariableName:
 *           type: string
 *           nullable: true
 *           description: Name of price variable used (e.g., "Member", "Custom")
 *         isCustomPrice:
 *           type: boolean
 *           default: false
 *           description: True if manually entered custom price
 *         quantity:
 *           type: number
 *           format: int32
 *         payedCash:
 *           type: boolean
 *         soldAt:
 *           type: string
 *           format: date-time
 *     SoldItemInput:
 *       type: object
 *       required:
 *         - itemId
 *         - finalSellPrice
 *         - quantity
 *       properties:
 *         itemId:
 *           type: number
 *           format: int64
 *         finalSellPrice:
 *           type: number
 *           format: decimal
 *         priceVariableName:
 *           type: string
 *           nullable: true
 *         isCustomPrice:
 *           type: boolean
 *           default: false
 *         quantity:
 *           type: number
 *           format: int32
 *         payedCash:
 *           type: boolean
 *           default: false
 *         soldAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 */

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

const soldItemRouter = express.Router();

// Apply auth middleware to all sold item routes
soldItemRouter.use(requireAuth);

/**
 * @swagger
 * /soldItems:
 *   get:
 *     summary: Get sold items user has access to
 *     description: Returns sold items from all inventories the authenticated user belongs to
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of accessible sold items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SoldItem'
 *       401:
 *         description: User not authenticated
 */
soldItemRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Get all inventories user has access to
    const userInventories = await inventoryDB.getInventoriesByUserId({ userId: user.id });
    const inventoryIds = userInventories.map(inv => inv.getId());
    
    if (inventoryIds.length === 0) {
        return res.status(200).json([]);
    }
    
    // Get sold items from accessible inventories only
    const soldItems = [];
    for (const inventoryId of inventoryIds) {
        const items = await soldItemDB.getSoldItemsByInventoryId({ inventoryId });
        soldItems.push(...items);
    }
    
    res.status(200).json(soldItems);
}));

/**
 * @swagger
 * /soldItems/{id}:
 *   get:
 *     summary: Get a sold item by ID
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: The sold item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SoldItem'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.get('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        
        const soldItem = await soldItemDB.getSoldItemById({ id });
        if (!soldItem) {
            throw createError.notFound('Sold item not found');
        }
        
        // Check access via item's inventory
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId: soldItem.getItemId()
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this sold item\'s inventory');
        }
        
        res.status(200).json(soldItem);
    })
);

/**
 * @swagger
 * /soldItems/item/{itemId}:
 *   get:
 *     summary: Get sold items by item ID
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of sold items for the specified item
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SoldItem'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 */
soldItemRouter.get('/item/:itemId',
    validateParams(itemIdParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { itemId } = req.params;
        const user = (req as any).user;
        
        // Check access via item's inventory
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this item\'s inventory');
        }
        
        const soldItems = await soldItemDB.getSoldItemsByItemId({ itemId });
        res.status(200).json(soldItems);
    })
);

/**
 * @swagger
 * /soldItems/inventory/{inventoryId}:
 *   get:
 *     summary: Get sold items by inventory ID
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of sold items for the specified inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SoldItem'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied to inventory
 */
soldItemRouter.get('/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params;
        const soldItems = await soldItemDB.getSoldItemsByInventoryId({ inventoryId });
        res.status(200).json(soldItems);
    })
);

/**
 * @swagger
 * /soldItems:
 *   post:
 *     summary: Create a new sold item (with automatic stock deduction)
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SoldItemInput'
 *     responses:
 *       201:
 *         description: The created sold item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SoldItem'
 *       400:
 *         description: Validation failed or insufficient stock
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 */
soldItemRouter.post('/',
    validateBody(soldItemInput),
    asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { itemId, finalSellPrice, priceVariableName, isCustomPrice, payedCash, quantity, soldAt } = req.body;
        
        // Check access via item's inventory
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this item\'s inventory');
        }
        
        // Use transactional method to atomically create sold item and update stock
        const soldItemResult = await soldItemDB.createSoldItemWithStockUpdate({
            itemId,
            finalSellPrice,
            priceVariableName,
            isCustomPrice,
            payedCash,
            quantity,
            soldAt: soldAt ? new Date(soldAt) : undefined
        });
        
        // Convert Prisma result to domain model
        const soldItem = SoldItem.from(soldItemResult);
        res.status(201).json(soldItem);
    })
);

/**
 * @swagger
 * /soldItems/{id}:
 *   put:
 *     summary: Update a sold item (with automatic stock adjustment)
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finalSellPrice:
 *                 type: number
 *                 format: decimal
 *               priceVariableName:
 *                 type: string
 *                 nullable: true
 *               isCustomPrice:
 *                 type: boolean
 *               quantity:
 *                 type: number
 *                 format: int32
 *               payedCash:
 *                 type: boolean
 *               soldAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *     responses:
 *       200:
 *         description: The updated sold item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SoldItem'
 *       400:
 *         description: Validation failed or insufficient stock
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.put('/:id',
    validateParams(idParam),
    validateBody(soldItemUpdateInput),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const { finalSellPrice, priceVariableName, isCustomPrice, payedCash, quantity, soldAt } = req.body;
        
        // First check if sold item exists and user has access
        const existingSoldItem = await soldItemDB.getSoldItemById({ id });
        if (!existingSoldItem) {
            throw createError.notFound('Sold item not found');
        }
        
        // Check access via item's inventory
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId: existingSoldItem.getItemId()
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this sold item\'s inventory');
        }
        
        // Use transactional method to atomically update sold item and adjust stock
        const soldItemResult = await soldItemDB.updateSoldItemWithStockAdjustment(id, {
            finalSellPrice,
            priceVariableName,
            isCustomPrice,
            payedCash,
            quantity,
            soldAt: soldAt ? new Date(soldAt) : undefined
        });
        
        // Convert Prisma result to domain model
        const soldItem = SoldItem.from(soldItemResult);
        res.status(200).json(soldItem);
    })
);

/**
 * @swagger
 * /soldItems/{id}:
 *   delete:
 *     summary: Delete a sold item (with automatic stock restoration)
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Sold item deleted successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.delete('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        
        // First check if sold item exists and user has access
        const existingSoldItem = await soldItemDB.getSoldItemById({ id });
        if (!existingSoldItem) {
            throw createError.notFound('Sold item not found');
        }
        
        // Check access via item's inventory
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId: existingSoldItem.getItemId()
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this sold item\'s inventory');
        }
        
        // Use transactional method to atomically delete sold item and restore stock
        await soldItemDB.deleteSoldItemWithStockRestore(id);
        res.status(204).send();
    })
);

/**
 * @swagger
 * /soldItems/inventory/{inventoryId}/analytics:
 *   get:
 *     summary: Get analytics for an inventory
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics data for the inventory
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied to inventory
 */
soldItemRouter.get('/inventory/:inventoryId/analytics',
    validateParams(inventoryIdParam),
    validateQuery(analyticsQuery),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params;
        const { startDate, endDate } = req.query;
        
        const analytics = await soldItemDB.getAnalyticsByInventoryId({
            inventoryId,
            startDate: startDate as Date,
            endDate: endDate as Date,
        });
        
        res.status(200).json(analytics);
    })
);

export { soldItemRouter };
