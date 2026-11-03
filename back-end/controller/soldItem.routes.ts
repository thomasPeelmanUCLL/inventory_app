import express from 'express';
import soldItemService from '../service/soldItem.service';
import { getMemberInventoryIds, requireInventoryRole, requireItemRole } from '../service/access.service';
import { currentUserId, requireAuth } from '../middleware/auth.middleware';
import {
    analyticsQuery,
    asyncHandler,
    idParam,
    inventoryIdParam,
    itemIdParam,
    SoldItemInput,
    soldItemInput,
    SoldItemUpdateInput,
    soldItemUpdateInput,
    validateBody,
    validateParams,
    validateQuery,
} from '../util/validators';
import { analyticsToDTO, soldItemToDTO, soldItemsToDTO } from '../dto/soldItem.dto';

const soldItemRouter = express.Router();

soldItemRouter.use(requireAuth);

/** Loads a sale and checks the user's role on its item's inventory. */
const getAuthorizedSale = async (id: number, userId: string, level: 'read' | 'write') => {
    const soldItem = await soldItemService.getSoldItemById({ id });
    await requireItemRole(userId, soldItem.getItemId(), level);
    return soldItem;
};

// Sales from every inventory the user is a member of
soldItemRouter.get(
    '/',
    asyncHandler(async (req, res) => {
        const inventoryIds = await getMemberInventoryIds(currentUserId(req));
        res.json(soldItemsToDTO(await soldItemService.getSoldItemsByInventoryIds({ inventoryIds })));
    }),
);

// Static paths before /:id
soldItemRouter.get(
    '/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    asyncHandler(async (req, res) => {
        const inventoryId = Number(req.params.inventoryId);
        await requireInventoryRole(currentUserId(req), inventoryId, 'read');
        res.json(soldItemsToDTO(await soldItemService.getSoldItemsByInventoryId({ inventoryId })));
    }),
);

soldItemRouter.get(
    '/inventory/:inventoryId/analytics',
    validateParams(inventoryIdParam),
    validateQuery(analyticsQuery),
    asyncHandler(async (req, res) => {
        const inventoryId = Number(req.params.inventoryId);
        await requireInventoryRole(currentUserId(req), inventoryId, 'read');
        const { startDate, endDate } = req.query as { startDate?: Date; endDate?: Date };
        const analytics = await soldItemService.getAnalyticsByInventoryId({ inventoryId, startDate, endDate });
        res.json(analyticsToDTO(analytics));
    }),
);

soldItemRouter.get(
    '/item/:itemId',
    validateParams(itemIdParam),
    asyncHandler(async (req, res) => {
        const itemId = Number(req.params.itemId);
        await requireItemRole(currentUserId(req), itemId, 'read');
        res.json(soldItemsToDTO(await soldItemService.getSoldItemsByItemId({ itemId })));
    }),
);

soldItemRouter.get(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        res.json(soldItemToDTO(await getAuthorizedSale(Number(req.params.id), currentUserId(req), 'read')));
    }),
);

soldItemRouter.post(
    '/',
    validateBody(soldItemInput),
    asyncHandler(async (req, res) => {
        const body = req.body as SoldItemInput;
        await requireItemRole(currentUserId(req), body.itemId, 'write');
        res.status(201).json(soldItemToDTO(await soldItemService.createSoldItem(body)));
    }),
);

soldItemRouter.put(
    '/:id',
    validateParams(idParam),
    validateBody(soldItemUpdateInput),
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        await getAuthorizedSale(id, currentUserId(req), 'write');
        res.json(soldItemToDTO(await soldItemService.updateSoldItem(id, req.body as SoldItemUpdateInput)));
    }),
);

soldItemRouter.delete(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        await getAuthorizedSale(id, currentUserId(req), 'write');
        await soldItemService.deleteSoldItem(id);
        res.status(204).send();
    }),
);

export { soldItemRouter };
