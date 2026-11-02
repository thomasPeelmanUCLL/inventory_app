/**
 * @swagger
 * tags:
 *   - name: Inventories
 *     description: Inventory management endpoints
 */

import express from 'express';
import inventoryService from '../service/inventory.service';
import { currentUserId, requireAuth } from '../middleware/auth.middleware';
import {
    addUserToInventoryInput,
    asyncHandler,
    idParam,
    inventoryInput,
    inventoryUpdateInput,
    inventoryUserParams,
    validateBody,
    validateParams,
} from '../util/validators';
import { inventoriesToDTO, inventoryToDTO, inventoryUserToDTO } from '../dto/inventory.dto';

const inventoryRouter = express.Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get(
    '/my',
    asyncHandler(async (req, res) => {
        res.json(inventoriesToDTO(await inventoryService.getInventoriesByUserId(currentUserId(req))));
    }),
);

inventoryRouter.get(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const inventory = await inventoryService.getInventoryById(Number(req.params.id), currentUserId(req));
        res.json(inventoryToDTO(inventory));
    }),
);

// The creator becomes owner
inventoryRouter.post(
    '/',
    validateBody(inventoryInput),
    asyncHandler(async (req, res) => {
        const inventory = await inventoryService.createInventory(req.body, currentUserId(req));
        res.status(201).json(inventoryToDTO(inventory));
    }),
);

inventoryRouter.put(
    '/:id',
    validateParams(idParam),
    validateBody(inventoryUpdateInput),
    asyncHandler(async (req, res) => {
        const inventory = await inventoryService.updateInventory(
            Number(req.params.id),
            req.body,
            currentUserId(req),
        );
        res.json(inventoryToDTO(inventory));
    }),
);

inventoryRouter.delete(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        await inventoryService.deleteInventory(Number(req.params.id), currentUserId(req));
        res.status(204).send();
    }),
);

inventoryRouter.get(
    '/:id/users',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const members = await inventoryService.getInventoryUsers(Number(req.params.id), currentUserId(req));
        res.json(members.map(inventoryUserToDTO));
    }),
);

inventoryRouter.post(
    '/:id/users',
    validateParams(idParam),
    validateBody(addUserToInventoryInput),
    asyncHandler(async (req, res) => {
        await inventoryService.addUserToInventory(Number(req.params.id), req.body, currentUserId(req));
        res.status(201).json({ message: 'User added successfully' });
    }),
);

inventoryRouter.delete(
    '/:id/users/:userId',
    validateParams(inventoryUserParams),
    asyncHandler(async (req, res) => {
        await inventoryService.removeUserFromInventory(
            req.params.userId,
            Number(req.params.id),
            currentUserId(req),
        );
        res.status(204).send();
    }),
);

export { inventoryRouter };
