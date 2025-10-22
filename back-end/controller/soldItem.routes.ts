import express, { NextFunction, Request, Response } from 'express';
import soldItemService from '../service/soldItem.service';

const soldItemRouter = express.Router();

soldItemRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItems = await soldItemService.getAllSoldItems();
        res.status(200).json(soldItems);
    } catch (error) {
        next(error);
    }
});

soldItemRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItem = await soldItemService.getSoldItemById({ id: Number(req.params.id) });
        res.status(200).json(soldItem);
    } catch (error) {
        next(error);
    }
});

soldItemRouter.get('/item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const soldItems = await soldItemService.getSoldItemsByItemId({ itemId: Number(req.params.itemId) });
        res.status(200).json(soldItems);
    } catch (error) {
        next(error);
    }
});

soldItemRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { itemId, sellingPrice, quantity, soldAt } = req.body;
        // Convert soldAt string to Date object if provided
        const soldAtDate = soldAt ? new Date(soldAt) : undefined;
        const soldItem = await soldItemService.createSoldItem({ 
            itemId: Number(itemId), 
            sellingPrice: Number(sellingPrice), 
            quantity: Number(quantity), 
            soldAt: soldAtDate 
        });
        res.status(201).json(soldItem);
    } catch (error) {
        next(error);
    }
});

soldItemRouter.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { sellingPrice, quantity, soldAt } = req.body;
        // Convert soldAt string to Date object if provided
        const soldAtDate = soldAt ? new Date(soldAt) : undefined;
        const soldItem = await soldItemService.updateSoldItem({ 
            id: Number(req.params.id), 
            sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : undefined, 
            quantity: quantity !== undefined ? Number(quantity) : undefined, 
            soldAt: soldAtDate 
        });
        res.status(200).json(soldItem);
    } catch (error) {
        next(error);
    }
});

soldItemRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        await soldItemService.deleteSoldItem({ id: Number(req.params.id) });
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export { soldItemRouter };