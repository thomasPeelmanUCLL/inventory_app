/**
 * @swagger
 * components:
 *   schemas:
 *     PriceVariable:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *           format: int64
 *         name:
 *           type: string
 *           description: Name of the price variable (e.g., "Member", "Non-Member", "Student")
 *         value:
 *           type: number
 *           format: float
 *           description: The value (percentage or fixed amount)
 *         type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *           description: Type of price adjustment
 *         isDefault:
 *           type: boolean
 *           default: false
 *           description: Whether this is the default price variable
 *         itemId:
 *           type: number
 *           format: int64
 *           description: The item this price variable belongs to
 *     PriceVariableInput:
 *       type: object
 *       required:
 *         - name
 *         - value
 *         - type
 *         - itemId
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *         value:
 *           type: number
 *           format: float
 *         type:
 *           type: string
 *           enum: [PERCENTAGE, FIXED]
 *         isDefault:
 *           type: boolean
 *           default: false
 *         itemId:
 *           type: number
 *           format: int64
 */

import express, { NextFunction, Request, Response } from 'express';
import priceVariableService from '../service/priceVariable.service';
import { requireAuth } from '../middleware/auth.middleware';

const priceVariableRouter = express.Router();

// Apply auth middleware to all price variable routes
priceVariableRouter.use(requireAuth);

/**
 * @swagger
 * /priceVariables:
 *   get:
 *     summary: Get all price variables
 *     tags:
 *       - Price Variables
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: A list of price variables
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PriceVariable'
 *       401:
 *         description: User not authenticated
 */
priceVariableRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const priceVariables = await priceVariableService.getAllPriceVariables();
        res.status(200).json(priceVariables);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /priceVariables/{id}:
 *   get:
 *     summary: Get a price variable by ID
 *     tags:
 *       - Price Variables
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
 *         description: The price variable details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceVariable'
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Price variable not found
 */
priceVariableRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const priceVariable = await priceVariableService.getPriceVariableById({ id: Number(req.params.id) });
        res.status(200).json(priceVariable);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /priceVariables/item/{itemId}:
 *   get:
 *     summary: Get price variables by item ID
 *     tags:
 *       - Price Variables
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     responses:
 *       200:
 *         description: List of price variables for the item
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PriceVariable'
 *       401:
 *         description: User not authenticated
 */
priceVariableRouter.get('/item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const priceVariables = await priceVariableService.getPriceVariablesByItemId({
            itemId: Number(req.params.itemId)
        });
        res.status(200).json(priceVariables);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /priceVariables:
 *   post:
 *     summary: Create a new price variable
 *     tags:
 *       - Price Variables
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PriceVariableInput'
 *     responses:
 *       201:
 *         description: The created price variable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceVariable'
 *       400:
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 */
priceVariableRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, itemId, value, type, isDefault } = req.body;

        const priceVariable = await priceVariableService.createPriceVariable({
            name,
            value: Number(value),
            type,
            isDefault: Boolean(isDefault),
            itemId: Number(itemId)
        });

        res.status(201).json(priceVariable);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /priceVariables/{id}:
 *   put:
 *     summary: Update a price variable
 *     tags:
 *       - Price Variables
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
 *               name:
 *                 type: string
 *               value:
 *                 type: number
 *                 format: float
 *               type:
 *                 type: string
 *                 enum: [PERCENTAGE, FIXED]
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: The updated price variable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PriceVariable'
 *       400:
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Price variable not found
 */
priceVariableRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, value, type, isDefault } = req.body;

        const priceVariable = await priceVariableService.updatePriceVariable({
            id: Number(req.params.id),
            name,
            value: value !== undefined ? Number(value) : undefined,
            type,
            isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined
        });

        res.status(200).json(priceVariable);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /priceVariables/{id}:
 *   delete:
 *     summary: Delete a price variable
 *     tags:
 *       - Price Variables
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
 *         description: Price variable deleted successfully
 *       401:
 *         description: User not authenticated
 *       404:
 *         description: Price variable not found
 */
priceVariableRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await priceVariableService.deletePriceVariable({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { priceVariableRouter };
