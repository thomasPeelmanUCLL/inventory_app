/**
 * @swagger
 *   components:
 *    schemas:
 *      Inventory:
 *          type: object
 *          properties:
 *            id:
 *              type: number
 *              format: int64
 *              description: The inventory ID.
 *            name:
 *              type: string
 *              description: The name of the inventory.
 *            description:
 *              type: string
 *              description: The description of the inventory.
 *            items:
 *              type: array
 *              items:
 *                $ref: '#/components/schemas/Item'
 *              description: The items in this inventory.
 *      InventoryInput:
 *          type: object
 *          required:
 *            - name
 *            - description
 *          properties:
 *            name:
 *              type: string
 *              description: The name of the inventory.
 *            description:
 *              type: string
 *              description: The description of the inventory.
 */
import express, { NextFunction, Request, Response } from 'express';
import inventoryService from '../service/inventory.service';


const inventoryRouter = express.Router();

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Get a list of all inventories
 *     tags:
 *       - Inventories
 *     responses:
 *       200:
 *         description: A list of inventories.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  $ref: '#/components/schemas/Inventory'
 */
inventoryRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventories = await inventoryService.getAllInventories();
        res.status(200).json(inventories);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory/name/{name}:
 *   get:
 *     summary: Get an inventory by name
 *     tags:
 *       - Inventories
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: The inventory name
 *     responses:
 *       200:
 *         description: The inventory details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory with name: Test does not exist."
 */
inventoryRouter.get('/name/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventory = await inventoryService.getInventoryByName({ name: req.params.name });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory:
 *   post:
 *     summary: Create a new inventory
 *     tags:
 *       - Inventories
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       201:
 *         description: The created inventory
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Name is required"
 */
inventoryRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body;
        const inventory = await inventoryService.createInventory({ name, description });
        res.status(201).json(inventory);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   put:
 *     summary: Update an inventory
 *     tags:
 *       - Inventories
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
 *             $ref: '#/components/schemas/InventoryInput'
 *     responses:
 *       200:
 *         description: The updated inventory
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Name is required"
 *       404:
 *         description: Inventory not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory with ID: 1 does not exist."
 */
inventoryRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body;
        const inventory = await inventoryService.updateInventory({ id: Number(req.params.id), name, description });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     summary: Delete an inventory
 *     tags:
 *       - Inventories
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
 *       404:
 *         description: Inventory not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory with ID: 1 does not exist."
 */
inventoryRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await inventoryService.deleteInventory({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory/{id}/items/{itemId}:
 *   post:
 *     summary: Add an item to an inventory
 *     tags:
 *       - Inventories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: The item ID
 *     responses:
 *       204:
 *         description: Item added to inventory successfully
 *       404:
 *         description: Inventory or item not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory with ID: 1 does not exist."
 */
inventoryRouter.post('/:id/items/:itemId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await inventoryService.addItemToInventory({ 
            inventoryId: Number(req.params.id), 
            itemId: Number(req.params.itemId) 
        });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     summary: Get an inventory by ID
 *     tags:
 *       - Inventories
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The inventory ID
 *     responses:
 *       200:
 *         description: The inventory details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       404:
 *         description: Inventory not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Inventory with ID: 1 does not exist."
 */
inventoryRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventory = await inventoryService.getInventoryById({ id: Number(req.params.id) });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

export {inventoryRouter};
