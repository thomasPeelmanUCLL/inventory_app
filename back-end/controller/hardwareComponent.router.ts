import hardwareComponentsService from '../service/hardwareComponents.service';
import express, { NextFunction, Request, Response } from 'express';

import { HardwareComponentInput } from '../types';

//import { hardwareComponentsInput } from '../types/index';

const hardwareComponentsRouter = express.Router();

hardwareComponentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hardwareComponents = await hardwareComponentsService.getAllHardwareComponents();
        res.status(200).json(hardwareComponents);
    } catch (error) {
        next(error);
    }
});

hardwareComponentsRouter.get('/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hardwareComponent = await hardwareComponentsService.getHardwareComponentByName({
            name: req.params.name,
        });
        res.status(200).json(hardwareComponent);
    } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
            res.status(404).json({ message: error.message });
        } else {
            next(error);
        }
    }
});

/**
 * @swagger
 * /hardware-components:
 *   post:
 *     summary: Create a hardware component
 *     tags:
 *       - Hardware Components
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HardwareComponentInput'
 *     responses:
 *       200:
 *         description: The created hardware component object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HardwareComponent'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
hardwareComponentsRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const hardwareComponentInput = <HardwareComponentInput>req.body;
        const hardwareComponent = await hardwareComponentsService.createHardwareComponent(
            hardwareComponentInput
        );
        res.status(200).json(hardwareComponent);
    } catch (error) {
        next(error);
    }
});

export { hardwareComponentsRouter };
