import express, { NextFunction, Request, Response } from 'express';
import inventoryService from '../service/inventory.service';


const inventoryRouter = express.Router();

inventoryRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventories = await inventoryService.getAllInventories();
        res.status(200).json(inventories);
    } catch (error) {
        next(error);
    }
});

inventoryRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventory = await inventoryService.getInventoryById({ id: Number(req.params.id) });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

inventoryRouter.get('/name/:name', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const inventory = await inventoryService.getInventoryByName({ name: req.params.name });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

inventoryRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body;
        const inventory = await inventoryService.createInventory({ name, description });
        res.status(201).json(inventory);
    } catch (error) {
        next(error);
    }
});

inventoryRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description } = req.body;
        const inventory = await inventoryService.updateInventory({ id: Number(req.params.id), name, description });
        res.status(200).json(inventory);
    } catch (error) {
        next(error);
    }
});

inventoryRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await inventoryService.deleteInventory({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export {inventoryRouter};