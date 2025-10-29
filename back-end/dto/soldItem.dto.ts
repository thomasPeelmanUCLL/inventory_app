import { SoldItem } from '../model/soldItem';
import { ItemDTO } from './item.dto';

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
  updatedAt: string | null; // some models may not have updatedAt
  
  // Computed fields for analytics
  totalSellValue?: string; // finalSellPrice * quantity
  totalBuyValue?: string; // item.buyPrice * quantity (if item included)
  profit?: string; // totalSellValue - totalBuyValue
}

export function soldItemToDTO(soldItem: SoldItem, includeItem = false): SoldItemDTO {
  const priceVar = soldItem.getPriceVariableName?.() ?? null;
  const createdAt = soldItem.getCreatedAt?.() ? soldItem.getCreatedAt().toISOString() : new Date().toISOString();
  const updatedAt = soldItem.getUpdatedAt?.() ? soldItem.getUpdatedAt().toISOString() : null;

  const dto: SoldItemDTO = {
    id: (soldItem as any).getId ? (soldItem as any).getId() : (soldItem as any).id,
    itemId: (soldItem as any).getItemId ? (soldItem as any).getItemId() : (soldItem as any).itemId,
    finalSellPrice: (soldItem as any).getFinalSellPrice ? (soldItem as any).getFinalSellPrice().toString() : String((soldItem as any).finalSellPrice),
    priceVariableName: priceVar,
    isCustomPrice: (soldItem as any).getIsCustomPrice ? (soldItem as any).getIsCustomPrice() : !!(soldItem as any).isCustomPrice,
    payedCash: (soldItem as any).isPayedCash ? (soldItem as any).isPayedCash() : !!(soldItem as any).payedCash,
    quantity: (soldItem as any).getQuantity ? (soldItem as any).getQuantity() : (soldItem as any).quantity,
    soldAt: ((soldItem as any).getSoldAt ? (soldItem as any).getSoldAt() : (soldItem as any).soldAt)?.toISOString?.() || new Date(((soldItem as any).soldAt || Date.now())).toISOString(),
    createdAt,
    updatedAt,
  };

  // Computed fields
  const sellPrice = (soldItem as any).getFinalSellPrice ? (soldItem as any).getFinalSellPrice() : (soldItem as any).finalSellPrice;
  if (sellPrice && dto.quantity != null) {
    try {
      const asNum = typeof sellPrice === 'number' ? sellPrice : Number(sellPrice);
      dto.totalSellValue = (asNum * dto.quantity).toFixed(2);
    } catch {}
  }

  // Include minimal item details if available
  if (includeItem && (soldItem as any).getItem) {
    const item = (soldItem as any).getItem();
    if (item) {
      const buyPrice = (item as any).getBuyPrice ? (item as any).getBuyPrice() : (item as any).buyPrice;
      dto.item = {
        id: (item as any).getId ? (item as any).getId() : (item as any).id,
        name: (item as any).getName ? (item as any).getName() : (item as any).name,
        buyPrice: buyPrice?.toString?.() || String(buyPrice),
        inventoryId: (item as any).getInventoryId ? (item as any).getInventoryId() : (item as any).inventoryId,
      } as any;

      // Profit fields
      try {
        const buyNum = typeof buyPrice === 'number' ? buyPrice : Number(buyPrice);
        const sellNum = typeof sellPrice === 'number' ? sellPrice : Number(sellPrice);
        dto.totalBuyValue = (buyNum * dto.quantity).toFixed(2);
        dto.profit = (sellNum * dto.quantity - buyNum * dto.quantity).toFixed(2);
      } catch {}
    }
  }

  return dto;
}

export function soldItemsToDTO(soldItems: SoldItem[], includeItems = false): SoldItemDTO[] {
  return soldItems.map(item => soldItemToDTO(item, includeItems));
}
