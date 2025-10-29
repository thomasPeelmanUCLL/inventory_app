import { SoldItem } from '../model/soldItem';
import { ItemDTO, itemToDTO } from './item.dto';

export interface SoldItemDTO {
  id: number;
  itemId: number;
  finalSellPrice: string; // Decimal as string for precision
  priceVariableName: string | null;
  isCustomPrice: boolean;
  payedCash: boolean;
  quantity: number;
  soldAt: string; // ISO string
  item?: Partial<ItemDTO>; // Nested item details (minimal)
  createdAt: string;
  updatedAt: string;
  
  // Computed fields for analytics
  totalSellValue?: string; // finalSellPrice * quantity
  totalBuyValue?: string; // item.buyPrice * quantity (if item included)
  profit?: string; // totalSellValue - totalBuyValue
}

export interface SoldItemAnalyticsDTO {
  summary: {
    totalBuyPrice: string;
    totalSellPrice: string;
    totalProfit: string;
    totalQuantitySold: number;
    totalTransactions: number;
    cashTransactions: number;
    nonCashTransactions: number;
    averageProfit: string;
    profitMargin: string; // percentage
  };
  topSellingItems: Array<{
    itemId: number;
    itemName: string;
    totalQuantity: number;
    totalBuyPrice: string;
    totalSellPrice: string;
    totalProfit: string;
    profitMargin: string;
    priceBreakdown: Array<{
      sellPrice: string;
      priceVariableName: string | null;
      quantity: number;
      totalBuy: string;
      totalSell: string;
      profit: string;
    }>;
  }>;
  salesByDay: Array<{
    date: string; // YYYY-MM-DD format
    totalBuyPrice: string;
    totalSellPrice: string;
    totalProfit: string;
    totalQuantity: number;
    transactionCount: number;
    averageTransactionValue: string;
  }>;
  paymentMethodBreakdown: {
    cash: {
      buyPrice: string;
      sellPrice: string;
      profit: string;
      transactionCount: number;
    };
    nonCash: {
      buyPrice: string;
      sellPrice: string;
      profit: string;
      transactionCount: number;
    };
  };
  priceVariableBreakdown: Array<{
    priceVariableName: string;
    count: number;
    totalBuyPrice: string;
    totalSellPrice: string;
    totalProfit: string;
    averageProfit: string;
  }>;
}

/**
 * Convert SoldItem model to clean DTO for API responses
 */
export function soldItemToDTO(soldItem: SoldItem, includeItem = false): SoldItemDTO {
  const dto: SoldItemDTO = {
    id: soldItem.getId(),
    itemId: soldItem.getItemId(),
    finalSellPrice: soldItem.getFinalSellPrice().toString(),
    priceVariableName: soldItem.getPriceVariableName(),
    isCustomPrice: soldItem.getIsCustomPrice(),
    payedCash: soldItem.isPayedCash(),
    quantity: soldItem.getQuantity(),
    soldAt: soldItem.getSoldAt().toISOString(),
    createdAt: soldItem.getCreatedAt().toISOString(),
    updatedAt: soldItem.getUpdatedAt().toISOString(),
  };

  // Add computed fields
  const sellPrice = soldItem.getFinalSellPrice();
  dto.totalSellValue = sellPrice.mul(soldItem.getQuantity()).toString();

  // Include minimal item details if available
  if (includeItem && soldItem.getItem) {
    const item = soldItem.getItem();
    if (item) {
      const buyPrice = item.getBuyPrice();
      dto.item = {
        id: item.getId(),
        name: item.getName(),
        buyPrice: buyPrice.toString(),
        inventoryId: item.getInventoryId(),
      };
      
      // Calculate profit if item included
      dto.totalBuyValue = buyPrice.mul(soldItem.getQuantity()).toString();
      dto.profit = sellPrice.mul(soldItem.getQuantity())
        .sub(buyPrice.mul(soldItem.getQuantity()))
        .toString();
    }
  }

  return dto;
}

/**
 * Convert array of SoldItems to DTOs
 */
export function soldItemsToDTO(soldItems: SoldItem[], includeItems = false): SoldItemDTO[] {
  return soldItems.map(item => soldItemToDTO(item, includeItems));
}

/**
 * Convert analytics response to DTO format
 */
export function analyticsToDTO(analytics: any): SoldItemAnalyticsDTO {
  const summary = analytics.summary;
  
  return {
    summary: {
      totalBuyPrice: Number(summary.totalBuyPrice).toFixed(2),
      totalSellPrice: Number(summary.totalSellPrice).toFixed(2),
      totalProfit: Number(summary.totalProfit).toFixed(2),
      totalQuantitySold: summary.totalQuantitySold,
      totalTransactions: summary.totalTransactions,
      cashTransactions: summary.cashTransactions,
      nonCashTransactions: summary.nonCashTransactions,
      averageProfit: summary.totalTransactions > 0 
        ? (Number(summary.totalProfit) / summary.totalTransactions).toFixed(2)
        : '0.00',
      profitMargin: summary.totalSellPrice > 0
        ? ((Number(summary.totalProfit) / Number(summary.totalSellPrice)) * 100).toFixed(2)
        : '0.00',
    },
    topSellingItems: analytics.topSellingItems.map((item: any) => ({
      ...item,
      totalBuyPrice: Number(item.totalBuyPrice).toFixed(2),
      totalSellPrice: Number(item.totalSellPrice).toFixed(2),
      totalProfit: Number(item.totalProfit).toFixed(2),
      profitMargin: item.totalSellPrice > 0
        ? ((Number(item.totalProfit) / Number(item.totalSellPrice)) * 100).toFixed(2)
        : '0.00',
      priceBreakdown: item.priceBreakdown.map((pb: any) => ({
        ...pb,
        sellPrice: Number(pb.sellPrice).toFixed(2),
        totalBuy: Number(pb.totalBuy).toFixed(2),
        totalSell: Number(pb.totalSell).toFixed(2),
        profit: Number(pb.profit).toFixed(2),
      }))
    })),
    salesByDay: analytics.salesByDay.map((day: any) => ({
      ...day,
      totalBuyPrice: Number(day.totalBuyPrice).toFixed(2),
      totalSellPrice: Number(day.totalSellPrice).toFixed(2),
      totalProfit: Number(day.totalProfit).toFixed(2),
      averageTransactionValue: day.transactionCount > 0
        ? (Number(day.totalSellPrice) / day.transactionCount).toFixed(2)
        : '0.00',
    })),
    paymentMethodBreakdown: {
      cash: {
        ...analytics.paymentMethodBreakdown.cash,
        buyPrice: Number(analytics.paymentMethodBreakdown.cash.buyPrice).toFixed(2),
        sellPrice: Number(analytics.paymentMethodBreakdown.cash.sellPrice).toFixed(2),
        profit: Number(analytics.paymentMethodBreakdown.cash.profit).toFixed(2),
        transactionCount: analytics.paymentMethodBreakdown.cash.transactionCount || 0,
      },
      nonCash: {
        ...analytics.paymentMethodBreakdown.nonCash,
        buyPrice: Number(analytics.paymentMethodBreakdown.nonCash.buyPrice).toFixed(2),
        sellPrice: Number(analytics.paymentMethodBreakdown.nonCash.sellPrice).toFixed(2),
        profit: Number(analytics.paymentMethodBreakdown.nonCash.profit).toFixed(2),
        transactionCount: analytics.paymentMethodBreakdown.nonCash.transactionCount || 0,
      },
    },
    priceVariableBreakdown: analytics.priceVariableBreakdown.map((pv: any) => ({
      ...pv,
      totalBuyPrice: Number(pv.totalBuyPrice).toFixed(2),
      totalSellPrice: Number(pv.totalSellPrice).toFixed(2),
      totalProfit: Number(pv.totalProfit).toFixed(2),
      averageProfit: pv.count > 0
        ? (Number(pv.totalProfit) / pv.count).toFixed(2)
        : '0.00',
    })),
  };
}
