import { Request, Response, NextFunction } from 'express';
import inventoryDB from '../repository/inventory.db';

/**
 * Middleware to ensure authenticated user has access to a specific inventory
 * Checks the InventoryUser relationship table
 */
export const requireInventoryAccess =
    (paramName: 'inventoryId' | 'id' = 'inventoryId') =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = (req as any).user;
            if (!user?.id) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            // Get inventoryId from params, body, or query
            const raw = req.params[paramName] ?? req.body[paramName] ?? req.query[paramName];
            const inventoryId = Number(raw);

            if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
                return res.status(400).json({ error: 'Invalid inventoryId' });
            }

            // Check if user has access to this inventory
            const hasAccess = await inventoryDB.userHasAccess({
                userId: user.id,
                inventoryId,
            });

            if (!hasAccess) {
                return res.status(403).json({ error: 'Access denied to this inventory' });
            }

            // Attach inventoryId to request for downstream use
            (req as any).inventoryId = inventoryId;
            next();
        } catch (error) {
            console.error('Authorization middleware error:', error);
            next(error);
        }
    };

/**
 * Middleware to check inventory access via item ownership
 * For routes that work with itemId but need to verify inventory access
 */
export const requireInventoryAccessViaItem = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const user = (req as any).user;
        if (!user?.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const itemId = Number(req.params.itemId || req.body.itemId);
        if (!Number.isInteger(itemId) || itemId <= 0) {
            return res.status(400).json({ error: 'Invalid itemId' });
        }

        // Get item and check inventory access
        const hasAccess = await inventoryDB.userHasAccessViaItem({
            userId: user.id,
            itemId,
        });

        if (!hasAccess) {
            return res.status(403).json({ error: "Access denied to this item's inventory" });
        }

        next();
    } catch (error) {
        console.error('Item authorization middleware error:', error);
        next(error);
    }
};
