import { Prisma } from '@prisma/client';
import database from '../repository/database';

// Standalone analytics implementation using Prisma to avoid repository circular deps
export async function getInventoryAnalyticsPrisma({
    inventoryId,
    startDate,
    endDate,
}: {
    inventoryId: number;
    startDate?: Date;
    endDate?: Date;
}) {
    const whereBase = {
        item: { inventoryId },
        ...(startDate ? { soldAt: { gte: startDate } } : {}),
        ...(endDate ? { soldAt: { lte: endDate } } : {}),
    } as any;

    // Summary
    const summaryAgg = await database.soldItem.aggregate({
        where: whereBase,
        _sum: {
            finalSellPrice: true,
            quantity: true,
        },
        _count: true,
    });

    // Join to get buyPrice for accurate buy totals
    const lines = await database.soldItem.findMany({
        where: whereBase,
        select: {
            finalSellPrice: true,
            quantity: true,
            paidCash: true,
            priceVariableName: true,
            item: { select: { id: true, name: true, buyPrice: true } },
            soldAt: true,
        },
        orderBy: { soldAt: 'asc' },
    });

    // Compute totals
    let totalBuyPrice = 0;
    let totalSellPrice = 0;
    let totalProfit = 0;
    let cashTransactions = 0;
    let nonCashTransactions = 0;

    const byItem = new Map<number, any>();
    const byDay = new Map<string, any>();
    const byPriceVar = new Map<string, any>();

    for (const s of lines) {
        const qty = Number(s.quantity);
        const sell = Number(s.finalSellPrice) * qty;
        const buy = Number(s.item.buyPrice) * qty;
        const profit = sell - buy;

        totalBuyPrice += buy;
        totalSellPrice += sell;
        totalProfit += profit;

        if (s.paidCash) cashTransactions++;
        else nonCashTransactions++;

        // by item
        const bi = byItem.get(s.item.id) || {
            itemId: s.item.id,
            itemName: s.item.name,
            totalQuantity: 0,
            totalBuyPrice: 0,
            totalSellPrice: 0,
            totalProfit: 0,
            priceBreakdown: new Map<string, any>(),
        };
        bi.totalQuantity += qty;
        bi.totalBuyPrice += buy;
        bi.totalSellPrice += sell;
        bi.totalProfit += profit;

        const pvKey = String(s.priceVariableName ?? 'DEFAULT');
        const pb = bi.priceBreakdown.get(pvKey) || {
            sellPrice: Number(s.finalSellPrice),
            priceVariableName: s.priceVariableName ?? null,
            quantity: 0,
            totalBuy: 0,
            totalSell: 0,
            profit: 0,
        };
        pb.quantity += qty;
        pb.totalBuy += buy;
        pb.totalSell += sell;
        pb.profit += profit;
        bi.priceBreakdown.set(pvKey, pb);

        byItem.set(s.item.id, bi);

        // by day
        const day = s.soldAt.toISOString().split('T')[0];
        const bd = byDay.get(day) || {
            date: day,
            totalBuyPrice: 0,
            totalSellPrice: 0,
            totalProfit: 0,
            totalQuantity: 0,
            transactionCount: 0,
        };
        bd.totalBuyPrice += buy;
        bd.totalSellPrice += sell;
        bd.totalProfit += profit;
        bd.totalQuantity += qty;
        bd.transactionCount += 1;
        byDay.set(day, bd);

        // price variable breakdown
        const pvAgg = byPriceVar.get(pvKey) || {
            priceVariableName: s.priceVariableName ?? 'DEFAULT',
            count: 0,
            totalBuyPrice: 0,
            totalSellPrice: 0,
            totalProfit: 0,
        };
        pvAgg.count += 1;
        pvAgg.totalBuyPrice += buy;
        pvAgg.totalSellPrice += sell;
        pvAgg.totalProfit += profit;
        byPriceVar.set(pvKey, pvAgg);
    }

    return {
        summary: {
            totalBuyPrice,
            totalSellPrice,
            totalProfit,
            totalQuantitySold: Number(summaryAgg._sum.quantity) || 0,
            totalTransactions: summaryAgg._count || lines.length,
            cashTransactions,
            nonCashTransactions,
        },
        topSellingItems: Array.from(byItem.values())
            .map((x: any) => ({
                itemId: x.itemId,
                itemName: x.itemName,
                totalQuantity: x.totalQuantity,
                totalBuyPrice: x.totalBuyPrice,
                totalSellPrice: x.totalSellPrice,
                totalProfit: x.totalProfit,
                priceBreakdown: Array.from(x.priceBreakdown.values()),
            }))
            .sort((a, b) => b.totalQuantity - a.totalQuantity)
            .slice(0, 25),
        salesByDay: Array.from(byDay.values()).sort((a, b) => a.date.localeCompare(b.date)),
        paymentMethodBreakdown: {
            cash: {
                buyPrice: Number(
                    Array.from(lines)
                        .filter((l) => l.paidCash)
                        .reduce((acc, s) => acc + Number(s.item.buyPrice) * Number(s.quantity), 0)
                        .toFixed(2),
                ),
                sellPrice: Number(
                    Array.from(lines)
                        .filter((l) => l.paidCash)
                        .reduce((acc, s) => acc + Number(s.finalSellPrice) * Number(s.quantity), 0)
                        .toFixed(2),
                ),
                profit: Number(
                    Array.from(lines)
                        .filter((l) => l.paidCash)
                        .reduce(
                            (acc, s) =>
                                acc +
                                (Number(s.finalSellPrice) - Number(s.item.buyPrice)) *
                                    Number(s.quantity),
                            0,
                        )
                        .toFixed(2),
                ),
                transactionCount: lines.filter((l) => l.paidCash).length,
            },
            nonCash: {
                buyPrice: Number(
                    Array.from(lines)
                        .filter((l) => !l.paidCash)
                        .reduce((acc, s) => acc + Number(s.item.buyPrice) * Number(s.quantity), 0)
                        .toFixed(2),
                ),
                sellPrice: Number(
                    Array.from(lines)
                        .filter((l) => !l.paidCash)
                        .reduce((acc, s) => acc + Number(s.finalSellPrice) * Number(s.quantity), 0)
                        .toFixed(2),
                ),
                profit: Number(
                    Array.from(lines)
                        .filter((l) => !l.paidCash)
                        .reduce(
                            (acc, s) =>
                                acc +
                                (Number(s.finalSellPrice) - Number(s.item.buyPrice)) *
                                    Number(s.quantity),
                            0,
                        )
                        .toFixed(2),
                ),
                transactionCount: lines.filter((l) => !l.paidCash).length,
            },
        },
        priceVariableBreakdown: Array.from(byPriceVar.values()),
    };
}
