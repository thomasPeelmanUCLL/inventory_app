/**
 * @swagger
 *   components:
 *    schemas:
 *      Item:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *              format: int64
 *              description: The item ID.
 *            name:
 *              type: string
 *              description: The name of the item.
 *            description:
 *              type: string
 *              description: The description of the item.
 *            price:
 *              type: number
 *              format: float
 *              description: The price of the item.
 *            quantity:
 *              type: number
 *              format: int32
 *              description: The quantity of the item.
 *            buyedAt:
 *              type: string
 *              format: date-time
 *              nullable: true
 *              description: The date when the item was purchased.
 *            createdAt:
 *              type: string
 *              format: date-time
 *              description: The date when the item was created.
 *            inventoryId:
 *              type: number
 *              format: int64
 *              nullable: true
 *              description: The ID of the inventory this item belongs to.
 *      ItemInput:
 *          type: object
 *          required:
 *            - name
 *            - description
 *            - price
 *            - quantity
 *          properties:
 *            name:
 *              type: string
 *              description: The name of the item.
 *            description:
 *              type: string
 *              description: The description of the item.
 *            price:
 *              type: number
 *              format: float
 *              description: The price of the item.
 *            quantity:
 *              type: number
 *              format: int32
 *              description: The quantity of the item.
 *            buyedAt:
 *              type: string
 *              format: date-time
 *              nullable: true
 *              description: The date when the item was purchased.
 *            inventoryId:
 *              type: number
 *              format: int64
 *              nullable: true
 *              description: The ID of the inventory this item belongs to.
 */
import express, { NextFunction, Request, Response } from 'express';
import itemService from '../service/item.service';


const itemRouter = express.Router();

/**
 * @swagger
 * /item:
 *   get:
 *     summary: Get a list of all items
 *     tags:
 *       - Items
 *     responses:
 *       200:
 *         description: A list of items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: '#/components/schemas/Item'
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
 * /item/{id}:
 *   get:
 *     summary: Get an item by ID
 *     tags:
 *       - Items
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
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item with ID: 1 does not exist."
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
 * /item:
 *   post:
 *     summary: Create a new item
 *     tags:
 *       - Items
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Name is required"
 */
itemRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, quantity, buyedAt, inventoryId } = req.body;
        // Convert buyedAt string to Date object if provided
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;
        const item = await itemService.createItem({ 
            name, 
            description, 
            price, 
            quantity, 
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
 * /item/{id}:
 *   put:
 *     summary: Update an item
 *     tags:
 *       - Items
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Name is required"
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item with ID: 1 does not exist."
 */
itemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, quantity, buyedAt, inventoryId } = req.body;
        // Convert buyedAt string to Date object if provided
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;
        const item = await itemService.updateItem({ 
            id: Number(req.params.id), 
            name, 
            description, 
            price, 
            quantity, 
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
 * /item/{id}:
 *   delete:
 *     summary: Delete an item
 *     tags:
 *       - Items
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
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Item with ID: 1 does not exist."
 */
itemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await itemService.deleteItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { itemRouter};
