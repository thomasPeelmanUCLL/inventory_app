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
import { requireAuth } from '../middleware/auth.middleware';

const itemRouter = express.Router();

// Apply auth middleware to all item routes
itemRouter.use(requireAuth);

/**
 * @swagger
 * /items:
 *   get:
 *     summary: Get all items
 *     tags:
 *       - Items
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of all items
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
 */
itemRouter.get('/inventory/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await itemService.getItemsByInventoryId({
            inventoryId: Number(req.params.inventoryId)
        });
        res.status(200).json(items);
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
 *         description: Item created successfully
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
        const { name, description, buyPrice, quantity, buyedAt, inventoryId } = req.body;
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;

        const item = await itemService.createItem({
            name,
            description,
            buyPrice: Number(buyPrice),
            quantity: Number(quantity),
            buyedAt: buyedAtDate,
            inventoryId: inventoryId ? Number(inventoryId) : undefined
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
 *         description: Item updated successfully
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
        const { name, description, buyPrice, quantity, buyedAt, inventoryId } = req.body;
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;

        const item = await itemService.updateItem({
            id: Number(req.params.id),
            name,
            description,
            buyPrice: Number(buyPrice),
            quantity: Number(quantity),
            buyedAt: buyedAtDate,
            inventoryId: inventoryId ? Number(inventoryId) : undefined
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
