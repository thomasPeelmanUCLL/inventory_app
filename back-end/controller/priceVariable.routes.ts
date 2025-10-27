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
 *         inventoryId:
 *           type: number
 *           format: int64
 *     PriceVariableInput:
 *       type: object
 *       required:
 *         - name
 *         - inventoryId
 *       properties:
 *         name:
 *           type: string
 *         inventoryId:
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
 * /priceVariables/inventory/{inventoryId}:
 *   get:
 *     summary: Get all price variables for an inventory
 *     tags:
 *       - Price Variables
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
 *         description: A list of price variables for the inventory
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/PriceVariable'
 */
priceVariableRouter.get('/inventory/:inventoryId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const priceVariables = await priceVariableService.getPriceVariablesByInventoryId({
            inventoryId: Number(req.params.inventoryId)
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
 *       400:
 *         description: Bad request
 */
priceVariableRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, inventoryId, value, type, isDefault } = req.body; // ← ADD value, type, isDefault
        const priceVariable = await priceVariableService.createPriceVariable({
            name,
            value: Number(value),           // ← ADD THIS
            type,                            // ← ADD THIS
            isDefault: Boolean(isDefault),   // ← ADD THIS
            inventoryId: Number(inventoryId)
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
 *     responses:
 *       200:
 *         description: The updated price variable
 *       404:
 *         description: Price variable not found
 */
priceVariableRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, value, type, isDefault } = req.body; // ← ADD value, type, isDefault
        const priceVariable = await priceVariableService.updatePriceVariable({
            id: Number(req.params.id),
            name,
            value: value !== undefined ? Number(value) : undefined,        // ← ADD THIS
            type,                                                          // ← ADD THIS
            isDefault: isDefault !== undefined ? Boolean(isDefault) : undefined // ← ADD THIS
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
