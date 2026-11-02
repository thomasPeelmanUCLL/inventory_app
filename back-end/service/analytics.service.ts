import { Prisma } from '@prisma/client';
import database from '../repository/database';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_ITEMS_LIMIT = 25;

type Totals = { totalBuyPrice: number; totalSellPrice: number; totalProfit: number };
type PriceTotals = Totals & { sellPrice: number; priceVariableName: string | null; quantity: number };
type ItemTotals = Totals & {
    itemId: number;
    itemName: string;
    totalQuantity: number;
    prices: Map<string, PriceTotals>;
};
type DayTotals = Totals & { date: string; totalQuantity: number; transactionCount: number };
type PaymentTotals = Totals & { transactionCount: number };

const emptyTotals = (): Totals => ({ totalBuyPrice: 0, totalSellPrice: 0, totalProfit: 0 });

const addTo = (totals: Totals, buy: number, sell: number) => {
    totals.totalBuyPrice += buy;
    totals.totalSellPrice += sell;
    totals.totalProfit += sell - buy;
};

/** Get-or-create for the Map buckets below. */
const bucket = <K, V>(map: Map<K, V>, key: K, create: () => V): V => {
    let value = map.get(key);
    if (!value) map.set(key, (value = create()));
    return value;
};

/**
 * soldAt filter. A date-only end date (what the UI sends, e.g. 2026-11-02) means
 * "through the end of that day", so it becomes an exclusive bound at the next midnight.
 */
const soldAtRange = (startDate?: Date, endDate?: Date): Prisma.DateTimeFilter | undefined => {
    if (!startDate && !endDate) return undefined;
    const endIsDateOnly = endDate !== undefined && endDate.getTime() % DAY_MS === 0;
    return {
        ...(startDate && { gte: startDate }),
        ...(endDate && (endIsDateOnly ? { lt: new Date(endDate.getTime() + DAY_MS) } : { lte: endDate })),
    };
};

const toPaymentDTO = ({ totalBuyPrice, totalSellPrice, totalProfit, transactionCount }: PaymentTotals) => ({
    buyPrice: totalBuyPrice,
    sellPrice: totalSellPrice,
    profit: totalProfit,
    transactionCount,
});

/** Sales analytics for one inventory, computed in a single pass over its sales. */
export async function getInventoryAnalytics({
    inventoryId,
    startDate,
    endDate,
}: {
    inventoryId: number;
    startDate?: Date;
    endDate?: Date;
}) {
    const sales = await database.soldItem.findMany({
        where: { item: { inventoryId }, soldAt: soldAtRange(startDate, endDate) },
        select: {
            finalSellPrice: true,
            quantity: true,
            paidCash: true,
            priceVariableName: true,
            soldAt: true,
            item: { select: { id: true, name: true, buyPrice: true } },
        },
        orderBy: { soldAt: 'asc' },
    });

    const summary = { ...emptyTotals(), totalQuantitySold: 0, cashTransactions: 0, nonCashTransactions: 0 };
    const cash: PaymentTotals = { ...emptyTotals(), transactionCount: 0 };
    const nonCash: PaymentTotals = { ...emptyTotals(), transactionCount: 0 };
    const byItem = new Map<number, ItemTotals>();
    const byDay = new Map<string, DayTotals>();
    const byPriceVariable = new Map<string, Totals & { priceVariableName: string; count: number }>();

    for (const sale of sales) {
        const quantity = sale.quantity;
        const unitSell = Number(sale.finalSellPrice);
        const sell = unitSell * quantity;
        const buy = Number(sale.item.buyPrice) * quantity;
        const priceKey = sale.priceVariableName ?? 'DEFAULT';
        const day = sale.soldAt.toISOString().slice(0, 10);

        addTo(summary, buy, sell);
        summary.totalQuantitySold += quantity;
        if (sale.paidCash) summary.cashTransactions++;
        else summary.nonCashTransactions++;

        const method = sale.paidCash ? cash : nonCash;
        addTo(method, buy, sell);
        method.transactionCount++;

        const item = bucket(byItem, sale.item.id, () => ({
            ...emptyTotals(),
            itemId: sale.item.id,
            itemName: sale.item.name,
            totalQuantity: 0,
            prices: new Map<string, PriceTotals>(),
        }));
        addTo(item, buy, sell);
        item.totalQuantity += quantity;

        const price = bucket(item.prices, priceKey, () => ({
            ...emptyTotals(),
            sellPrice: unitSell,
            priceVariableName: sale.priceVariableName,
            quantity: 0,
        }));
        addTo(price, buy, sell);
        price.quantity += quantity;

        const dayTotals = bucket(byDay, day, () => ({
            ...emptyTotals(),
            date: day,
            totalQuantity: 0,
            transactionCount: 0,
        }));
        addTo(dayTotals, buy, sell);
        dayTotals.totalQuantity += quantity;
        dayTotals.transactionCount++;

        const priceVariable = bucket(byPriceVariable, priceKey, () => ({
            ...emptyTotals(),
            priceVariableName: priceKey,
            count: 0,
        }));
        addTo(priceVariable, buy, sell);
        priceVariable.count++;
    }

    return {
        summary: { ...summary, totalTransactions: sales.length },
        topSellingItems: [...byItem.values()]
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, TOP_ITEMS_LIMIT)
            .map(({ prices, ...item }) => ({
                ...item,
                priceBreakdown: [...prices.values()].map(
                    ({ totalBuyPrice, totalSellPrice, totalProfit, ...rest }) => ({
                        ...rest,
                        totalBuy: totalBuyPrice,
                        totalSell: totalSellPrice,
                        profit: totalProfit,
                    }),
                ),
            })),
        // Sales come back sorted by soldAt, so days are already in order
        salesByDay: [...byDay.values()],
        paymentMethodBreakdown: { cash: toPaymentDTO(cash), nonCash: toPaymentDTO(nonCash) },
        priceVariableBreakdown: [...byPriceVariable.values()],
    };
}

export type InventoryAnalytics = Awaited<ReturnType<typeof getInventoryAnalytics>>;
