/**
 * @swagger
 *   components:
 *    schemas:
 *      Setup:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *            ownerId:
 *              type: number
 *            details:
 *              type: string
 *            lastUpdated:
 *              type: string
 *              format: date-time
 *            hardwareComponents:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/HardwareComponent'
 *            images:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Image'
 *      SetupUpdateData:
 *          type: object
 *          properties:
 *            details:
 *              type: string
 *              description: Setup details
 *            hardwareComponents:
 *              type: array
 *              items:
 *                type: number
 *              description: Array of hardware component IDs
 *            images:
 *              type: array
 *              items:
 *                type: number
 *              description: Array of image IDs
 *      HardwareComponent:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *            name:
 *              type: string
 *            details:
 *              type: string
 *            price:
 *              type: number
 *      Image:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *            url:
 *              type: string
 *            details:
 *              type: string
 */

import express, { NextFunction, Request, Response } from 'express';
import setupService from '../service/setup.service';
import userService from '../service/user.service';
import jwt from 'jsonwebtoken';
import { Role, SetupInput, SetupUpdateData, AuthRequest } from '../types';

const setupRouter = express.Router();

const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication token required' });
    }

    try {
        const auth = jwt.verify(token, process.env.JWT_SECRET!) as { email: string; role: Role };
        (req as AuthRequest).auth = auth;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }
};

/**
 * @swagger
 * /setups:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get all setups
 *     responses:
 *       200:
 *         description: List of all setups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Setup'
 */
setupRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
        const setups = await setupService.getAllSetups();
        res.status(200).json(setups);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /setups/my:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get user's setups
 *     responses:
 *       200:
 *         description: List of user's setups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Setup'
 *       404:
 *         description: User not found
 */
setupRouter.get(
    '/my',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const setups = await setupService.getSetupsByOwnerId({ ownerId: user.getId() });
            res.status(200).json(setups);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /setups/{id}:
 *   get:
 *     security:
 *       - bearerAuth: []
 *     summary: Get setup by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: The setup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setup'
 *       404:
 *         description: Setup not found
 */
setupRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const id = parseInt(req.params.id);
        const setup = await setupService.getSetupById({ id });
        if (!setup) {
            return res.status(404).json({ message: 'Setup not found' });
        }
        res.status(200).json(setup);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /setups:
 *   post:
 *     security:
 *       - bearerAuth: []
 *     summary: Create a new setup
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               details:
 *                 type: string
 *                 description: Setup details
 *               hardwareComponentIds:
 *                 type: array
 *                 items:
 *                   type: number
 *               imageIds:
 *                 type: array
 *                 items:
 *                   type: number
 *     responses:
 *       201:
 *         description: The created setup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setup'
 *       404:
 *         description: User not found
 */
setupRouter.post(
    '/',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const setupInput: SetupInput = {
                ownerId: user.getId(),
                details: req.body.details,
                hardwareComponentIds: req.body.hardwareComponentIds,
                imageIds: req.body.imageIds,
            };

            const setup = await setupService.createSetup(setupInput);
            res.status(201).json(setup);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /setups/{id}:
 *   put:
 *     security:
 *       - bearerAuth: []
 *     summary: Update a setup
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetupUpdateData'
 *     responses:
 *       200:
 *         description: The updated setup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Setup'
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Setup or user not found
 */
setupRouter.put(
    '/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { email, role } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const existingSetup = await setupService.getSetupById({ id });
            if (!existingSetup) {
                return res.status(404).json({ message: 'Setup not found' });
            }

            if (existingSetup.getOwnerId() !== user.getId() && role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to update this setup' });
            }

            const setupData: SetupUpdateData = {
                details: req.body.details,
                hardwareComponents: req.body.hardwareComponentIds,
                images: req.body.imageIds,
            };

            const setup = await setupService.updateSetup(id, setupData);
            res.status(200).json(setup);
        } catch (error) {
            next(error);
        }
    }
);

/**
 * @swagger
 * /setups/{id}:
 *   delete:
 *     security:
 *       - bearerAuth: []
 *     summary: Delete a setup
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       204:
 *         description: Setup deleted successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Setup or user not found
 */
setupRouter.delete(
    '/:id',
    authenticateToken,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = parseInt(req.params.id);
            const { email, role } = (req as AuthRequest).auth;
            const user = await userService.getUserByEmail({ email });

            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }

            const existingSetup = await setupService.getSetupById({ id });
            if (!existingSetup) {
                return res.status(404).json({ message: 'Setup not found' });
            }

            if (existingSetup.getOwnerId() !== user.getId() && role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this setup' });
            }

            await setupService.deleteSetup({ id });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
);

export { setupRouter };
