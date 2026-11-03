import express, { RequestHandler } from 'express';
import { createHash, timingSafeEqual } from 'node:crypto';
import database from '../repository/database';
import { asyncHandler } from '../util/validators';

const router = express.Router();

const sha256 = (value: string) => createHash('sha256').update(value).digest();

/** Machine-to-machine auth for the ISWLeuven food-api. Hashing first makes the compare length-independent. */
const requireIntegrationToken: RequestHandler = (req, res, next) => {
    const expected = process.env.INTEGRATION_TOKEN;
    const provided = req.header('X-Integration-Token');
    if (!expected || !provided || !timingSafeEqual(sha256(provided), sha256(expected))) {
        return res.status(401).json({ error: 'Invalid integration token' });
    }
    next();
};

type CatalogueCategory = {
    id: string;
    title: string;
    emoji: string;
    items: Array<{
        id: string;
        name: string;
        priceNonMember: number;
        priceMember: number;
        amount: number;
        available: boolean;
    }>;
};

const toCents = (value: unknown): number => Math.round(Number(value) * 100);

/** Published items of the website inventory, grouped by category, prices in cents. */
router.get(
    '/iswleuven/catalogue',
    requireIntegrationToken,
    asyncHandler(async (_req, res) => {
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
                memberPrice: true,
                nonMemberPrice: true,
            },
            orderBy: [{ websiteSortOrder: 'asc' }, { name: 'asc' }],
        });

        // Categories appear in the order of their first item; the emoji is the first one any item sets
        const categories = new Map<string, CatalogueCategory>();
        for (const item of items) {
            const title = item.websiteCategory!;
            let category = categories.get(title);
            if (!category) categories.set(title, (category = { id: title, title, emoji: '', items: [] }));
            if (!category.emoji && item.websiteEmoji) category.emoji = item.websiteEmoji;
            category.items.push({
                id: String(item.id),
                name: item.name,
                priceNonMember: toCents(item.nonMemberPrice),
                priceMember: toCents(item.memberPrice),
                amount: item.quantity,
                available: item.quantity > 0,
            });
        }

        res.set('Cache-Control', 'no-store');
        res.json([...categories.values()]);
    }),
);

export { router as integrationRouter };
