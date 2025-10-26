/**
 * @swagger
 * tags:
 *   - name: Inventories
 *     description: Inventory management endpoints
 *
 * components:
 *   schemas:
 *     Inventory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: The inventory ID
 *         name:
 *           type: string
 *           description: The inventory name
 *         description:
 *           type: string
 *           description: The inventory description
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     InventoryInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           minLength: 3
 *           description: The inventory name (min 3 characters)
 *         description:
 *           type: string
 *           description: The inventory description
 *
 *     InventoryUserRole:
 *       type: string
 *       enum: [owner, editor, viewer]
 *       description: User role in inventory
 */

import express, { NextFunction, Request, Response } from 'express';
import inventoryService from '../service/inventory.service';
import { Inventory } from '../model/inventory';
import { requireAuth } from '../middleware/auth.middleware';

const inventoryRouter = express.Router();

// Apply auth middleware to all inventory routes
inventoryRouter.use(requireAuth);

/**
 * @swagger
 * /inventorys/my:
 *   get:
 *     summary: Get all inventories for the authenticated user
 *     description: Returns all inventories where the user has any access level (owner, editor, or viewer)
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     responses:
 *       200:
 *         description: List of user's inventories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Inventory'
 *       401:
 *         description: User not authenticated
 */
inventoryRouter.get('/my', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventories = await inventoryService.getInventoriesByUserId(userId);
        res.status(200).json(inventories);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}:
 *   get:
 *     summary: Get inventory by ID
 *     description: Returns a specific inventory if the user has access to it
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       200:
 *         description: Inventory details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 *       404:
 *         description: Inventory not found
 */
inventoryRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);

        // Check if user has access
        const role = await inventoryService.checkUserAccess(userId, inventoryId);
        if (!role) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const inventory = await inventoryService.getInventoryById(inventoryId);
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys:
 *   post:
 *     summary: Create a new inventory
 *     description: Creates a new inventory with the authenticated user as owner
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       201:
 *         description: Inventory created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Bad request
 *       401:
 *         description: User not authenticated
 */
inventoryRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventory = new Inventory({
            name: req.body.name,
            description: req.body.description,
        });
        const result = await inventoryService.createInventory(inventory, userId);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}:
 *   delete:
 *     summary: Delete an inventory
 *     description: Delete an inventory (owner only)
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       204:
 *         description: Inventory deleted successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Only owners can delete inventories
 *       404:
 *         description: Inventory not found
 */
inventoryRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);
        await inventoryService.deleteInventory(inventoryId, userId);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}/users:
 *   get:
 *     summary: Get all users with access to inventory
 *     description: Returns all users who have access to this inventory and their roles
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       200:
 *         description: List of users with access
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   role:
 *                     $ref: '#/components/schemas/InventoryUserRole'
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Access denied
 */
inventoryRouter.get('/:id/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);
        const users = await inventoryService.getInventoryUsers(inventoryId, userId);
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}/users:
 *   post:
 *     summary: Add user to inventory
 *     description: Grant a user access to an inventory with a specific role. Only owners can add users.
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - role
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user ID to add
 *               role:
 *                 $ref: '#/components/schemas/InventoryUserRole'
 *     responses:
 *       201:
 *         description: User added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User added successfully"
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Only owners can add users
 */
inventoryRouter.post('/:id/users', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestingUserId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);
        const { userId, role } = req.body;

        await inventoryService.addUserToInventory(
            userId,
            inventoryId,
            role,
            requestingUserId
        );
        res.status(201).json({ message: 'User added successfully' });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}/users/{userId}:
 *   delete:
 *     summary: Remove user from inventory
 *     description: Remove a user's access to an inventory. Only owners can remove users. Owner cannot remove themselves.
 *     tags:
 *       - Inventories
 *     security:
 *       - betterAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The user ID to remove
 *     responses:
 *       204:
 *         description: User removed successfully
 *       401:
 *         description: User not authenticated
 *       403:
 *         description: Only owners can remove users, or cannot remove yourself as owner
 */
inventoryRouter.delete('/:id/users/:userId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const requestingUserId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);
        const userIdToRemove = req.params.userId;

        await inventoryService.removeUserFromInventory(
            userIdToRemove,
            inventoryId,
            requestingUserId
        );
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventorys/{id}:
 *   put:
 *     summary: Update an inventory
 *     description: Update inventory properties (owner or editor only)
 *     tags:
 *       - Inventories
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
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       200:
 *         description: Inventory updated successfully
 *       403:
 *         description: Access denied
 */
inventoryRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.headers['x-user-id'] as string;
        const inventoryId = parseInt(req.params.id);
        const updated = await inventoryService.updateInventory(inventoryId, req.body, userId);
        res.status(200).json(updated);
    } catch (error) {
        next(error);
    }
});


export { inventoryRouter };
