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

import express from 'express';
import priceVariableService from '../service/priceVariable.service';
import { currentUserId, requireAuth } from '../middleware/auth.middleware';
import {
    asyncHandler,
    idParam,
    itemIdParam,
    priceVariableInput,
    priceVariableUpdateInput,
    validateBody,
    validateParams,
} from '../util/validators';
import { priceVariableToDTO, priceVariablesToDTO } from '../dto/priceVariable.dto';

const priceVariableRouter = express.Router();

// Every route checks the caller's role on the inventory the price variable's item belongs to
priceVariableRouter.use(requireAuth);

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
priceVariableRouter.get(
    '/item/:itemId',
    validateParams(itemIdParam),
    asyncHandler(async (req, res) => {
        const priceVariables = await priceVariableService.getPriceVariablesByItemId(
            Number(req.params.itemId),
            currentUserId(req),
        );
        res.json(priceVariablesToDTO(priceVariables));
    }),
);

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
priceVariableRouter.get(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const priceVariable = await priceVariableService.getPriceVariableById(
            Number(req.params.id),
            currentUserId(req),
        );
        res.json(priceVariableToDTO(priceVariable));
    }),
);

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
priceVariableRouter.post(
    '/',
    validateBody(priceVariableInput),
    asyncHandler(async (req, res) => {
        const priceVariable = await priceVariableService.createPriceVariable(req.body, currentUserId(req));
        res.status(201).json(priceVariableToDTO(priceVariable));
    }),
);

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
priceVariableRouter.put(
    '/:id',
    validateParams(idParam),
    validateBody(priceVariableUpdateInput),
    asyncHandler(async (req, res) => {
        const priceVariable = await priceVariableService.updatePriceVariable(
            Number(req.params.id),
            req.body,
            currentUserId(req),
        );
        res.json(priceVariableToDTO(priceVariable));
    }),
);

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
priceVariableRouter.delete(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        await priceVariableService.deletePriceVariable(Number(req.params.id), currentUserId(req));
        res.status(204).send();
    }),
);

export { priceVariableRouter };
