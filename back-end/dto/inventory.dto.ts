import { Inventory, InventoryMember } from '../model/inventory';
import { ItemDTO, itemToDTO } from './item.dto';

export interface InventoryUserDTO {
    id: number;
    userId: string;
    inventoryId: number;
    role: string;
    addedAt: string;
    user: { id: string; name: string; email: string };
}

export interface InventoryDTO {
    id: number;
    name: string;
    description: string;
    createdAt: string | null;
    items: ItemDTO[];
    users: InventoryUserDTO[];
}

export const inventoryUserToDTO = (member: InventoryMember): InventoryUserDTO => ({
    id: member.id,
    userId: member.userId,
    inventoryId: member.inventoryId,
    role: member.role,
    addedAt: member.addedAt.toISOString(),
    user: { id: member.user.id, name: member.user.name, email: member.user.email },
});

export const inventoryToDTO = (inventory: Inventory): InventoryDTO => ({
    id: inventory.getId(),
    name: inventory.getName(),
    description: inventory.getDescription(),
    createdAt: inventory.getCreatedAt()?.toISOString() ?? null,
    items: inventory.getItems().map(itemToDTO),
    users: inventory.getUsers().map(inventoryUserToDTO),
});

export const inventoriesToDTO = (inventories: Inventory[]): InventoryDTO[] => inventories.map(inventoryToDTO);
