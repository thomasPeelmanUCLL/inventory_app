/**
 * @swagger
 * components:
 *   schemas:
 *     Item:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           format: int64
 *         name:
 *           type: string
 *           description: Item name
 *         description:
 *           type: string
 *           description: Item description
 *         buyPrice:
 *           type: number
 *           format: decimal
 *           description: Purchase price
 *         quantity:
 *           type: integer
 *           description: Current quantity in stock
 *         buyedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Date item was purchased
 *         inventoryId:
 *           type: number
 *           format: int64
 *           nullable: true
 *           description: Associated inventory ID
 *         priceVariables:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/PriceVariable'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ItemInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - buyPrice
 *         - quantity
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         description:
 *           type: string
 *         buyPrice:
 *           type: number
 *           format: decimal
 *           minimum: 0
 *         quantity:
 *           type: integer
 *           minimum: 0
 *         buyedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         inventoryId:
 *           type: number
 *           format: int64
 *           nullable: true
 */

import express, { NextFunction, Request, Response } from 'express';
import itemService from '../service/item.service';
import inventoryDB from '../repository/inventory.db';
import { requireAuth } from '../middleware/auth.middleware';
import { requireInventoryAccess, requireInventoryAccessViaItem } from '../middleware/authorization.middleware';
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

const itemRouter = express.Router();

// Apply auth middleware to all item routes
itemRouter.use(requireAuth);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items user has access to
 *     description: Returns items from all inventories the authenticated user belongs to
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of accessible items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: User not authenticated
 */
itemRouter.get('/', asyncHandler(async (req: Request, res: Response) => {
    const user = (req as any).user;
    
    // Get all inventories user has access to
    const userInventories = await inventoryDB.getInventoriesByUserId({ userId: user.id });
    const inventoryIds = userInventories.map(inv => inv.getId());
    
    if (inventoryIds.length === 0) {
        return res.status(200).json([]);
    }
    
    // Get items from accessible inventories only
    const items = await itemService.getItemsByInventoryIds({ inventoryIds });
    res.status(200).json(items);
}));

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get item by ID
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     responses:
 *       200:
 *         description: Item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied to this item's inventory
 *       404:
 *         description: Item not found
 */
itemRouter.get('/:id', 
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        
        // Get item first to check its inventory
        const item = await itemService.getItemById({ id });
        
        if (!item.getInventoryId()) {
            throw createError.notFound('Item not found');
        }
        
        // Check if user has access to this item's inventory
        const hasAccess = await inventoryDB.userHasAccess({
            userId: user.id,
            inventoryId: item.getInventoryId()!
        });
        
        if (!hasAccess) {
            throw createError.forbidden('Access denied to this item\'s inventory');
        }
        
        res.status(200).json(item);
    })
);

/**
 * @swagger
 * /items/inventory/{inventoryId}:
 *   get:
 *     summary: Get items by inventory ID
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: inventoryId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       200:
 *         description: List of items in the inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied to this inventory
 */
itemRouter.get('/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    requireInventoryAccess('inventoryId'),
    asyncHandler(async (req: Request, res: Response) => {
        const { inventoryId } = req.params;
        const items = await itemService.getItemsByInventoryId({ inventoryId });
        res.status(200).json(items);
    })
);

/**
 * @swagger
 * /items:
 *   post:
 *     summary: Create a new item
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       201:
 *         description: Item created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied to inventory
 */
itemRouter.post('/',
    validateBody(itemInput),
    asyncHandler(async (req: Request, res: Response) => {
        const user = (req as any).user;
        const { inventoryId, ...itemData } = req.body;
        
        // If inventoryId provided, check access
        if (inventoryId) {
            const hasAccess = await inventoryDB.userHasAccess({
                userId: user.id,
                inventoryId
            });
            
            if (!hasAccess) {
                throw createError.forbidden('Access denied to this inventory');
            }
        }
        
        const item = await itemService.createItem({
            ...itemData,
            inventoryId
        });
        
        res.status(201).json(item);
    })
);

/**
 * @swagger
 * /items/{id}:
 *   put:
 *     summary: Update an item
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ItemInput'
 *     responses:
 *       200:
 *         description: Item updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Validation failed
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 */
itemRouter.put('/:id',
    validateParams(idParam),
    validateBody(itemUpdateInput),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        const { inventoryId: newInventoryId, ...updateData } = req.body;
        
        // Get existing item to check current inventory access
        const existingItem = await itemService.getItemById({ id });
        
        if (existingItem.getInventoryId()) {
            const hasCurrentAccess = await inventoryDB.userHasAccess({
                userId: user.id,
                inventoryId: existingItem.getInventoryId()!
            });
            
            if (!hasCurrentAccess) {
                throw createError.forbidden('Access denied to this item\'s current inventory');
            }
        }
        
        // If moving to new inventory, check access to target inventory
        if (newInventoryId && newInventoryId !== existingItem.getInventoryId()) {
            const hasNewAccess = await inventoryDB.userHasAccess({
                userId: user.id,
                inventoryId: newInventoryId
            });
            
            if (!hasNewAccess) {
                throw createError.forbidden('Access denied to target inventory');
            }
        }
        
        const item = await itemService.updateItem({
            id,
            ...updateData,
            inventoryId: newInventoryId
        });
        
        res.status(200).json(item);
    })
);

/**
 * @swagger
 * /items/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     responses:
 *       204:
 *         description: Item deleted successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Item not found
 */
itemRouter.delete('/:id',
    validateParams(idParam),
    asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        const user = (req as any).user;
        
        // Check access via item's inventory
        const item = await itemService.getItemById({ id });
        
        if (item.getInventoryId()) {
            const hasAccess = await inventoryDB.userHasAccess({
                userId: user.id,
                inventoryId: item.getInventoryId()!
            });
            
            if (!hasAccess) {
                throw createError.forbidden('Access denied to this item\'s inventory');
            }
        }
        
        await itemService.deleteItem({ id });
        res.status(204).send();
    })
);

export { itemRouter };
