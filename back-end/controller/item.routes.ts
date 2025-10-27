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
 *           description: The item ID.
 *         name:
 *           type: string
 *           description: The name of the item.
 *         description:
 *           type: string
 *           description: The description of the item.
 *         buyPrice:
 *           type: number
 *           format: decimal
 *           description: The price the item was bought at.
 *         quantity:
 *           type: number
 *           format: int32
 *           description: The quantity of the item.
 *         buyedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The date when the item was purchased.
 *         priceVariableId:
 *           type: number
 *           format: int64
 *           nullable: true
 *           description: The ID of the default price variable for this item.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the item was created.
 *         inventoryId:
 *           type: number
 *           format: int64
 *           nullable: true
 *           description: The ID of the inventory this item belongs to.
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
 *           description: The name of the item.
 *         description:
 *           type: string
 *           description: The description of the item.
 *         buyPrice:
 *           type: number
 *           format: decimal
 *           description: The price the item was bought at.
 *         quantity:
 *           type: number
 *           format: int32
 *           description: The quantity of the item.
 *         buyedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: The date when the item was purchased.
 *         priceVariableId:
 *           type: number
 *           format: int64
 *           nullable: true
 *           description: The ID of the default price variable for this item.
 *         inventoryId:
 *           type: number
 *           format: int64
 *           nullable: true
 *           description: The ID of the inventory this item belongs to.
 */

import express, { NextFunction, Request, Response } from 'express';
import itemService from '../service/item.service';
import { requireAuth } from '../middleware/auth.middleware';

const itemRouter = express.Router();

// Apply auth middleware to all item routes
itemRouter.use(requireAuth);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get a list of all items
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *       401:
 *         description: User not authenticated
 */
itemRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await itemService.getAllItems();
        res.status(200).json(items);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /items/{id}:
 *   get:
 *     summary: Get an item by ID
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
 *         description: The item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Item not found
 */
itemRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = await itemService.getItemById({ id: Number(req.params.id) });
        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

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
 *         description: The created item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 */
itemRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, buyPrice, quantity, buyedAt, inventoryId, priceVariableId } = req.body;
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;

        const item = await itemService.createItem({
            name,
            description,
            buyPrice: Number(buyPrice),  // Changed from price
            quantity,
            buyedAt: buyedAtDate,
            inventoryId: inventoryId ? Number(inventoryId) : undefined,
            priceVariableId: priceVariableId ? Number(priceVariableId) : undefined  // Added
        });

        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
});

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
 *         description: The updated item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *       400:
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Item not found
 */
itemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, buyPrice, quantity, buyedAt, inventoryId, priceVariableId } = req.body;
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;

        const item = await itemService.updateItem({
            id: Number(req.params.id),
            name,
            description,
            buyPrice: Number(buyPrice),  // Changed from price
            quantity,
            buyedAt: buyedAtDate,
            inventoryId: inventoryId ? Number(inventoryId) : undefined,
            priceVariableId: priceVariableId ? Number(priceVariableId) : undefined  // Added
        });

        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

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
 *       404:
 *         description: Item not found
 */
itemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await itemService.deleteItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { itemRouter };
