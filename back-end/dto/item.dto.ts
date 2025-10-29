import { Item } from '../model/item';
import { Decimal } from '@prisma/client/runtime/library';

export interface ItemDTO {
  id: number;
  name: string;
  description: string;
  buyPrice: string; // Decimal as string for precision
  quantity: number;
  buyedAt: string | null; // ISO string
  inventoryId: number | null;
  priceVariables?: PriceVariableDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface PriceVariableDTO {
  id: number;
  name: string;
  value: string; // Decimal as string
  type: 'PERCENTAGE' | 'FIXED';
  isDefault: boolean;
  itemId: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Convert Item model to clean DTO for API responses
 * Ensures no internal methods are exposed and decimals are properly serialized
 */
export function itemToDTO(item: Item): ItemDTO {
  return {
    id: item.getId(),
    name: item.getName(),
    description: item.getDescription(),
    buyPrice: item.getBuyPrice().toString(), // Decimal to string for precision
    quantity: item.getQuantity(),
    buyedAt: item.getBuyedAt()?.toISOString() || null,
    inventoryId: item.getInventoryId(),
    priceVariables: item.getPriceVariables()?.map(pv => ({
      id: pv.getId(),
      name: pv.getName(),
      value: pv.getValue().toString(),
      type: pv.getType() as 'PERCENTAGE' | 'FIXED',
      isDefault: pv.getIsDefault(),
      itemId: pv.getItemId(),
      createdAt: pv.getCreatedAt().toISOString(),
      updatedAt: pv.getUpdatedAt().toISOString(),
    })),
    createdAt: item.getCreatedAt().toISOString(),
    updatedAt: item.getUpdatedAt().toISOString(),
  };
}

/**
 * Convert array of Items to DTOs
 */
export function itemsToDTO(items: Item[]): ItemDTO[] {
  return items.map(itemToDTO);
}

/**
 * Input validation helpers for Item DTOs
 */
export function validateItemInput(data: any): {
  name: string;
  description: string;
  buyPrice: number;
  quantity: number;
  buyedAt?: Date;
  inventoryId?: number;
} {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Item name is required and must be a string');
  }
  
  if (typeof data.description !== 'string') {
    throw new Error('Item description must be a string');
  }
  
  const buyPrice = Number(data.buyPrice);
  if (isNaN(buyPrice) || buyPrice < 0) {
    throw new Error('Buy price must be a positive number');
  }
  
  const quantity = Number(data.quantity);
  if (isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
    throw new Error('Quantity must be a non-negative integer');
  }
  
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    buyPrice,
    quantity,
    buyedAt: data.buyedAt ? new Date(data.buyedAt) : undefined,
    inventoryId: data.inventoryId ? Number(data.inventoryId) : undefined,
  };
}
