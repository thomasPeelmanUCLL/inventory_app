import { SoldItem } from '../model/soldItem';
import type { InventoryAnalytics } from '../service/analytics.service';

export interface SoldItemDTO {
    id: number;
    itemId: number;
    finalSellPrice: string;
    priceVariableName: string | null;
    isCustomPrice: boolean;
    paidCash: boolean;
    quantity: number;
    soldAt: string;
    totalSellValue: string;
    item?: { id: number; name: string; buyPrice: string; inventoryId: number | null };
    totalBuyValue?: string;
    profit?: string;
}

const money = (value: number) => value.toFixed(2);

export function soldItemToDTO(soldItem: SoldItem): SoldItemDTO {
    const quantity = soldItem.getQuantity();
    const sellTotal = soldItem.getFinalSellPrice().toNumber() * quantity;
    const dto: SoldItemDTO = {
        id: soldItem.getId(),
        itemId: soldItem.getItemId(),
        finalSellPrice: soldItem.getFinalSellPrice().toString(),
        priceVariableName: soldItem.getPriceVariableName() ?? null,
        isCustomPrice: soldItem.getIsCustomPrice(),
        paidCash: soldItem.isPaidCash(),
        quantity,
        soldAt: soldItem.getSoldAt().toISOString(),
        totalSellValue: money(sellTotal),
    };

    const item = soldItem.getItem();
    if (item) {
        const buyTotal = item.getBuyPrice().toNumber() * quantity;
        dto.item = {
            id: item.getId(),
            name: item.getName(),
            buyPrice: item.getBuyPrice().toString(),
            inventoryId: item.getInventoryId() ?? null,
        };
        dto.totalBuyValue = money(buyTotal);
        dto.profit = money(sellTotal - buyTotal);
    }
    return dto;
}

export const soldItemsToDTO = (soldItems: SoldItem[]): SoldItemDTO[] => soldItems.map(soldItemToDTO);

const ratio = (part: number, whole: number, scale = 1) => (whole > 0 ? money((part / whole) * scale) : '0.00');

type Totals = { totalBuyPrice: number; totalSellPrice: number; totalProfit: number };
const totalsToDTO = ({ totalBuyPrice, totalSellPrice, totalProfit }: Totals) => ({
    totalBuyPrice: money(totalBuyPrice),
    totalSellPrice: money(totalSellPrice),
    totalProfit: money(totalProfit),
});

/** Analytics with money as 2-decimal strings and derived averages/margins filled in. */
export function analyticsToDTO(analytics: InventoryAnalytics) {
    const { summary, paymentMethodBreakdown: payment } = analytics;
    const paymentToDTO = (p: typeof payment.cash) => ({
        buyPrice: money(p.buyPrice),
        sellPrice: money(p.sellPrice),
        profit: money(p.profit),
        transactionCount: p.transactionCount,
    });

    return {
        summary: {
            ...totalsToDTO(summary),
            totalQuantitySold: summary.totalQuantitySold,
            totalTransactions: summary.totalTransactions,
            cashTransactions: summary.cashTransactions,
            nonCashTransactions: summary.nonCashTransactions,
            averageProfit: ratio(summary.totalProfit, summary.totalTransactions),
            profitMargin: ratio(summary.totalProfit, summary.totalSellPrice, 100),
        },
        topSellingItems: analytics.topSellingItems.map((item) => ({
            itemId: item.itemId,
            itemName: item.itemName,
            totalQuantity: item.totalQuantity,
            ...totalsToDTO(item),
            profitMargin: ratio(item.totalProfit, item.totalSellPrice, 100),
            priceBreakdown: item.priceBreakdown.map((price) => ({
                sellPrice: money(price.sellPrice),
                priceVariableName: price.priceVariableName,
                quantity: price.quantity,
                totalBuy: money(price.totalBuy),
                totalSell: money(price.totalSell),
                profit: money(price.profit),
            })),
        })),
        salesByDay: analytics.salesByDay.map((day) => ({
            date: day.date,
            ...totalsToDTO(day),
            totalQuantity: day.totalQuantity,
            transactionCount: day.transactionCount,
            averageTransactionValue: ratio(day.totalSellPrice, day.transactionCount),
        })),
        paymentMethodBreakdown: { cash: paymentToDTO(payment.cash), nonCash: paymentToDTO(payment.nonCash) },
        priceVariableBreakdown: analytics.priceVariableBreakdown.map((pv) => ({
            priceVariableName: pv.priceVariableName,
            count: pv.count,
            ...totalsToDTO(pv),
            averageProfit: ratio(pv.totalProfit, pv.count),
        })),
    };
}
