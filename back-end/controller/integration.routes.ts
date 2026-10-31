import express, { Request, Response } from 'express';
import database from '../repository/database';
import { asyncHandler } from '../util/validators';

const router = express.Router();

const toCents = (value: any): number => Math.round(Number(value) * 100);

router.get(
    '/iswleuven/catalogue',
    asyncHandler(async (req: Request, res: Response) => {
        const expectedToken = process.env.INTEGRATION_TOKEN;
        const providedToken = req.header('X-Integration-Token');

        if (!expectedToken || providedToken !== expectedToken) {
            return res.status(401).json({ error: 'Invalid integration token' });
        }

        const inventoryId = Number(process.env.WEBSITE_INVENTORY_ID);
        if (!Number.isInteger(inventoryId) || inventoryId <= 0) {
            return res.status(500).json({ error: 'WEBSITE_INVENTORY_ID is not configured' });
        }

        const items = await database.item.findMany({
            where: {
                inventoryId,
                publishedToWebsite: true,
                websiteCategory: { not: null },
                memberPrice: { not: null },
                nonMemberPrice: { not: null },
            },
            select: {
                id: true,
                name: true,
                quantity: true,
                websiteCategory: true,
                websiteEmoji: true,
                websiteSortOrder: true,
                memberPrice: true,
                nonMemberPrice: true,
            },
            orderBy: [{ websiteSortOrder: 'asc' }, { name: 'asc' }],
        });

        const categoryMap = new Map<string, any>();

        for (const item of items) {
            const category = item.websiteCategory!;
            if (!categoryMap.has(category)) {
                categoryMap.set(category, {
                    id: category,
                    title: category,
                    emoji: item.websiteEmoji ?? '',
                    items: [],
                });
            }

            categoryMap.get(category).items.push({
                id: String(item.id),
                name: item.name,
                priceNonMember: toCents(item.nonMemberPrice),
                priceMember: toCents(item.memberPrice),
                amount: item.quantity,
                available: item.quantity > 0,
            });
        }

        res.set('Cache-Control', 'no-store');
        return res.json(Array.from(categoryMap.values()));
    }),
);

export { router as integrationRouter };
