import express from 'express';
import itemService from '../service/item.service';
import { getMemberInventoryIds, requireInventoryRole, requireItemRole } from '../service/access.service';
import { currentUserId, requireAuth } from '../middleware/auth.middleware';
import {
    asyncHandler,
    idParam,
    inventoryIdParam,
    ItemInput,
    itemInput,
    ItemUpdateInput,
    itemUpdateInput,
    validateBody,
    validateParams,
} from '../util/validators';
import { itemToDTO, itemsToDTO } from '../dto/item.dto';

const itemRouter = express.Router();

itemRouter.use(requireAuth);

// Items from every inventory the user is a member of
itemRouter.get(
    '/',
    asyncHandler(async (req, res) => {
        const inventoryIds = await getMemberInventoryIds(currentUserId(req));
        res.json(itemsToDTO(await itemService.getItemsByInventoryIds({ inventoryIds })));
    }),
);

itemRouter.get(
    '/inventory/:inventoryId',
    validateParams(inventoryIdParam),
    asyncHandler(async (req, res) => {
        const inventoryId = Number(req.params.inventoryId);
        await requireInventoryRole(currentUserId(req), inventoryId, 'read');
        res.json(itemsToDTO(await itemService.getItemsByInventoryId({ inventoryId })));
    }),
);

itemRouter.get(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        await requireItemRole(currentUserId(req), id, 'read');
        res.json(itemToDTO(await itemService.getItemById({ id })));
    }),
);

itemRouter.post(
    '/',
    validateBody(itemInput),
    asyncHandler(async (req, res) => {
        const body = req.body as ItemInput;
        if (body.inventoryId) await requireInventoryRole(currentUserId(req), body.inventoryId, 'write');
        res.status(201).json(itemToDTO(await itemService.createItem(body)));
    }),
);

itemRouter.put(
    '/:id',
    validateParams(idParam),
    validateBody(itemUpdateInput),
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        const userId = currentUserId(req);
        const body = req.body as ItemUpdateInput;
        const currentInventoryId = await requireItemRole(userId, id, 'write');
        // Moving an item needs write access on the destination too
        if (body.inventoryId && body.inventoryId !== currentInventoryId) {
            await requireInventoryRole(userId, body.inventoryId, 'write');
        }
        res.json(itemToDTO(await itemService.updateItem({ id, ...body })));
    }),
);

itemRouter.delete(
    '/:id',
    validateParams(idParam),
    asyncHandler(async (req, res) => {
        const id = Number(req.params.id);
        await requireItemRole(currentUserId(req), id, 'write');
        await itemService.deleteItem({ id });
        res.status(204).send();
    }),
);

export { itemRouter };
