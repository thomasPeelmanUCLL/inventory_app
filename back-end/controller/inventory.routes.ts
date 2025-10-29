/**
 * @swagger
 * tags:
 *   - name: Inventories
 *     description: Inventory management endpoints
 */

import express, { NextFunction, Request, Response } from 'express';
import inventoryService from '../service/inventory.service';
import { Inventory } from '../model/inventory';
import { requireAuth } from '../middleware/auth.middleware';
import { createError } from '../middleware/error.middleware';
import { validateBody, validateParams, idParam, inventoryInput, inventoryUpdateInput } from '../util/validators';

const inventoryRouter = express.Router();

// All inventory routes require auth
inventoryRouter.use(requireAuth);

// Get all inventories for authenticated user
inventoryRouter.get('/my', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = (req as any).user;
        const inventories = await inventoryService.getInventoriesByUserId(user.id);
        res.status(200).json(inventories);
    } catch (error) { next(error); }
});

// Get inventory by ID (access controlled)
inventoryRouter.get('/:id',
    validateParams(idParam),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as any;
            const user = (req as any).user;

            const role = await inventoryService.checkUserAccess(user.id, Number(id));
            if (!role) return next(createError.forbidden('Access denied'));

            const inventory = await inventoryService.getInventoryById(Number(id));
            res.status(200).json(inventory);
        } catch (error) { next(error); }
    }
);

// Create inventory (creator becomes owner)
inventoryRouter.post('/',
    validateBody(inventoryInput),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            const inventory = new Inventory({ name: req.body.name, description: req.body.description });
            const result = await inventoryService.createInventory(inventory, user.id);
            res.status(201).json(result);
        } catch (error) { next(error); }
    }
);

// Delete inventory (owner only)
inventoryRouter.delete('/:id',
    validateParams(idParam),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as any;
            const user = (req as any).user;
            await inventoryService.deleteInventory(Number(id), user.id);
            res.status(204).send();
        } catch (error) { next(error); }
    }
);

// Get users of inventory (access controlled)
inventoryRouter.get('/:id/users',
    validateParams(idParam),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as any;
            const user = (req as any).user;
            const users = await inventoryService.getInventoryUsers(Number(id), user.id);
            res.status(200).json(users);
        } catch (error) { next(error); }
    }
);

// Add user to inventory (owner only)
inventoryRouter.post('/:id/users',
    validateParams(idParam),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as any;
            const requestingUserId = (req as any).user.id;
            const { userId, role } = req.body;
            await inventoryService.addUserToInventory(userId, Number(id), role, requestingUserId);
            res.status(201).json({ message: 'User added successfully' });
        } catch (error) { next(error); }
    }
);

// Remove user from inventory (owner only)
inventoryRouter.delete('/:id/users/:userId',
    validateParams(idParam),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id, userId } = req.params as any;
            const requestingUserId = (req as any).user.id;
            await inventoryService.removeUserFromInventory(userId, Number(id), requestingUserId);
            res.status(204).send();
        } catch (error) { next(error); }
    }
);

// Update inventory (owner or editor)
inventoryRouter.put('/:id',
    validateParams(idParam),
    validateBody(inventoryUpdateInput),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params as any;
            const user = (req as any).user;
            const updated = await inventoryService.updateInventory(Number(id), req.body, user.id);
            res.status(200).json(updated);
        } catch (error) { next(error); }
    }
);

export { inventoryRouter };