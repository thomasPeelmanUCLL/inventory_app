/**
 * @swagger
 *   components:
 *    schemas:
 *      SoldItem:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *              format: int64
 *              description: The sold item ID.
 *            itemId:
 *              type: number
 *              format: int64
 *              description: The ID of the item that was sold.
 *            sellingPrice:
 *              type: number
 *              format: float
 *              description: The price at which the item was sold.
 *            quantity:
 *              type: number
 *              format: int32
 *              description: The quantity of the item that was sold.
 *            payedCash:
 *              type: boolean
 *              description: Whether the item was paid for in cash.
 *            soldAt:
 *              type: string
 *              format: date-time
 *              nullable: true
 *              description: The date when the item was sold.
 *            createdAt:
 *              type: string
 *              format: date-time
 *              description: The date when the sold item record was created.
 *      SoldItemInput:
 *          type: object
 *          required:
 *            - itemId
 *            - sellingPrice
 *            - quantity
 *          properties:
 *            itemId:
 *              type: number
 *              format: int64
 *              description: The ID of the item to be sold.
 *            sellingPrice:
 *              type: number
 *              format: float
 *              description: The price at which to sell the item.
 *            quantity:
 *              type: number
 *              format: int32
 *              description: The quantity of the item to sell.
 *            payedCash:
 *              type: boolean
 *              default: false
 *              description: Whether the item was paid for in cash.
 *            soldAt:
 *              type: string
 *              format: date-time
 *              nullable: true
 *              description: The date when the item was sold.
 */
import express, { NextFunction, Request, Response } from 'express';
import soldItemService from '../service/soldItem.service';

const soldItemRouter = express.Router();

/**
 * @swagger
 * /soldItem:
 *   get:
 *     summary: Get a list of all sold items
 *     tags:
 *       - Sold Items
 *     responses:
 *       200:
 *         description: A list of sold items.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: '#/components/schemas/SoldItem'
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
 * /soldItem/{id}:
 *   get:
 *     summary: Get a sold item by ID
 *     tags:
 *       - Sold Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sold item ID
 *     responses:
 *       200:
 *         description: The sold item details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SoldItem'
 *       404:
 *         description: Sold item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SoldItem with ID: 1 does not exist."
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
 * /soldItem/item/{itemId}:
 *   get:
 *     summary: Get sold items by item ID
 *     tags:
 *       - Sold Items
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     responses:
 *       200:
 *         description: A list of sold items for the specified item
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: '#/components/schemas/SoldItem'
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
 * /soldItem:
 *   post:
 *     summary: Create a new sold item
 *     tags:
 *       - Sold Items
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not enough quantity available for item with ID: 1"
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
 * /soldItem/{id}:
 *   put:
 *     summary: Update a sold item
 *     tags:
 *       - Sold Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sold item ID
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
 *                 description: The price at which the item was sold.
 *               quantity:
 *                 type: number
 *                 format: int32
 *                 description: The quantity of the item that was sold.
 *               payedCash:
 *                 type: boolean
 *                 description: Whether the item was paid for in cash.
 *               soldAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: The date when the item was sold.
 *     responses:
 *       200:
 *         description: The updated sold item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SoldItem'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not enough quantity available for item with ID: 1"
 *       404:
 *         description: Sold item or item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SoldItem with ID: 1 does not exist."
 */
soldItemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sellingPrice, payedCash, quantity, soldAt } = req.body;
        // Convert soldAt string to Date object if provided
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
 * /soldItem/{id}:
 *   delete:
 *     summary: Delete a sold item
 *     tags:
 *       - Sold Items
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The sold item ID
 *     responses:
 *       204:
 *         description: Sold item deleted successfully
 *       404:
 *         description: Sold item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SoldItem with ID: 1 does not exist."
 */
soldItemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await soldItemService.deleteSoldItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { soldItemRouter };
