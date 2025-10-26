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
 *         sellingPrice:
 *           type: number
 *           format: float
 *         quantity:
 *           type: number
 *           format: int32
 *         payedCash:
 *           type: boolean
 *         soldAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *     SoldItemInput:
 *       type: object
 *       required:
 *         - itemId
 *         - sellingPrice
 *         - quantity
 *       properties:
 *         itemId:
 *           type: number
 *           format: int64
 *         sellingPrice:
 *           type: number
 *           format: float
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
import soldItemService from '../service/soldItem.service';
import { requireAuth } from '../middleware/auth.middleware';

const soldItemRouter = express.Router();

// Apply auth middleware to all sold item routes
soldItemRouter.use(requireAuth);

/**
 * @swagger
 * /soldItems:
 *   get:
 *     summary: Get a list of all sold items
 *     tags:
 *       - Sold Items
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of sold items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/SoldItem'
 *       401:
 *         description: User not authenticated
 */
soldItemRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItems = await soldItemService.getAllSoldItems();
        res.status(200).json(soldItems);
    } catch (error) {
        next(error);
    }
});

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
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItem = await soldItemService.getSoldItemById({ id: Number(req.params.id) });
        res.status(200).json(soldItem);
    } catch (error) {
        next(error);
    }
});

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
 */
soldItemRouter.get('/item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItems = await soldItemService.getSoldItemsByItemId({ itemId: Number(req.params.itemId) });
        res.status(200).json(soldItems);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /soldItems:
 *   post:
 *     summary: Create a new sold item
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
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Item not found
 */
soldItemRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { itemId, sellingPrice, payedCash, quantity, soldAt } = req.body;
        const soldAtDate = soldAt ? new Date(soldAt) : undefined;

        const soldItem = await soldItemService.createSoldItem({
            itemId: Number(itemId),
            sellingPrice: Number(sellingPrice),
            payedCash: Boolean(payedCash),
            quantity: Number(quantity),
            soldAt: soldAtDate
        });
        res.status(201).json(soldItem);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /soldItems/{id}:
 *   put:
 *     summary: Update a sold item
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
 *               sellingPrice:
 *                 type: number
 *                 format: float
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
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sellingPrice, payedCash, quantity, soldAt } = req.body;
        const soldAtDate = soldAt ? new Date(soldAt) : undefined;

        const soldItem = await soldItemService.updateSoldItem({
            id: Number(req.params.id),
            sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined,
            payedCash: payedCash !== undefined ? Boolean(payedCash) : undefined,
            quantity: quantity !== undefined ? Number(quantity) : undefined,
            soldAt: soldAtDate
        });
        res.status(200).json(soldItem);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /soldItems/{id}:
 *   delete:
 *     summary: Delete a sold item
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
 *       404:
 *         description: Sold item not found
 */
soldItemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await soldItemService.deleteSoldItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

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
 */
soldItemRouter.get('/inventory/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItems = await soldItemService.getSoldItemsByInventoryId({ inventoryId: Number(req.params.inventoryId) });
        res.status(200).json(soldItems);
    } catch (error) {
        next(error);
    }
});


export { soldItemRouter };
