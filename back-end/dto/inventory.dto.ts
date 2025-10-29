import { Inventory } from '../model/inventory';

export interface InventoryDTO {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userRole?: 'owner' | 'editor' | 'viewer'; // Current user's role in this inventory
  userCount?: number; // Number of users with access
  itemCount?: number; // Number of items in inventory
  totalValue?: string; // Total value of items (buy price * quantity)
}

export interface InventoryUserDTO {
  userId: string;
  inventoryId: number;
  role: 'owner' | 'editor' | 'viewer';
  user?: {
    id: string;
    name: string;
    email: string;
  };
  joinedAt: string;
}

/**
 * Convert Inventory model to clean DTO for API responses
 */
export function inventoryToDTO(
  inventory: Inventory, 
  userRole?: string,
  additionalData?: {
    userCount?: number;
    itemCount?: number;
    totalValue?: number;
  }
): InventoryDTO {
  const dto: InventoryDTO = {
    id: inventory.getId(),
    name: inventory.getName(),
    description: inventory.getDescription(),
    createdAt: inventory.getCreatedAt().toISOString(),
    updatedAt: inventory.getUpdatedAt().toISOString(),
  };

  if (userRole) {
    dto.userRole = userRole as 'owner' | 'editor' | 'viewer';
  }

  if (additionalData) {
    if (additionalData.userCount !== undefined) {
      dto.userCount = additionalData.userCount;
    }
    if (additionalData.itemCount !== undefined) {
      dto.itemCount = additionalData.itemCount;
    }
    if (additionalData.totalValue !== undefined) {
      dto.totalValue = additionalData.totalValue.toFixed(2);
    }
  }

  return dto;
}

/**
 * Convert array of Inventories to DTOs
 */
export function inventoriesToDTO(
  inventories: Inventory[], 
  userRoles?: Record<number, string>,
  additionalData?: Record<number, { userCount?: number; itemCount?: number; totalValue?: number }>
): InventoryDTO[] {
  return inventories.map(inventory => 
    inventoryToDTO(
      inventory,
      userRoles?.[inventory.getId()],
      additionalData?.[inventory.getId()]
    )
  );
}

/**
 * Input validation for inventory creation/updates
 */
export function validateInventoryInput(data: any): {
  name: string;
  description: string;
} {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 3) {
    throw new Error('Inventory name is required and must be at least 3 characters');
  }
  
  if (!data.description || typeof data.description !== 'string') {
    throw new Error('Inventory description is required');
  }
  
  return {
    name: data.name.trim(),
    description: data.description.trim(),
  };
}

/**
 * Convert inventory user relationship to DTO
 */
export function inventoryUserToDTO(inventoryUser: any): InventoryUserDTO {
  return {
    userId: inventoryUser.userId,
    inventoryId: inventoryUser.inventoryId,
    role: inventoryUser.role,
    user: inventoryUser.user ? {
      id: inventoryUser.user.id,
      name: inventoryUser.user.name,
      email: inventoryUser.user.email,
    } : undefined,
    joinedAt: inventoryUser.createdAt?.toISOString() || new Date().toISOString(),
  };
}
