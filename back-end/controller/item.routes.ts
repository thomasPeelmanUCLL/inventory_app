import express, { NextFunction, Request, Response } from 'express';
import itemService from '../service/item.service';


const itemRouter = express.Router();

itemRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const items = await itemService.getAllItems();
        res.status(200).json(items);
    } catch (error) {
        next(error);
    }
});

itemRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const item = await itemService.getItemById({ id: Number(req.params.id) });
        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

itemRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, quantity, buyedAt } = req.body;
        // Convert buyedAt string to Date object if provided
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;
        const item = await itemService.createItem({ name, description, price, quantity, buyedAt: buyedAtDate });
        res.status(201).json(item);
    } catch (error) {
        next(error);
    }
});

itemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, description, price, quantity, buyedAt } = req.body;
        // Convert buyedAt string to Date object if provided
        const buyedAtDate = buyedAt ? new Date(buyedAt) : undefined;
        const item = await itemService.updateItem({ id: Number(req.params.id), name, description, price, quantity, buyedAt: buyedAtDate });
        res.status(200).json(item);
    } catch (error) {
        next(error);
    }
});

itemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await itemService.deleteItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { itemRouter};
