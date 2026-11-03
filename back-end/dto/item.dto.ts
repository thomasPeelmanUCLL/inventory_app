import { Item } from '../model/item';
import { PriceVariableDTO, priceVariableToDTO } from './priceVariable.dto';

/** Money is sent as a decimal string ("1.5") so no precision is lost in transit. */
export interface ItemDTO {
    id: number;
    name: string;
    description: string;
    buyPrice: string;
    quantity: number;
    buyedAt: string | null;
    inventoryId: number | null;
    websiteCategory: string | null;
    websiteEmoji: string | null;
    websiteSortOrder: number;
    memberPrice: string | null;
    nonMemberPrice: string | null;
    publishedToWebsite: boolean;
    priceVariables: PriceVariableDTO[];
    createdAt: string;
}

export const itemToDTO = (item: Item): ItemDTO => ({
    id: item.getId(),
    name: item.getName(),
    description: item.getDescription(),
    buyPrice: item.getBuyPrice().toString(),
    quantity: item.getQuantity(),
    buyedAt: item.getBuyedAt()?.toISOString() ?? null,
    inventoryId: item.getInventoryId() ?? null,
    websiteCategory: item.getWebsiteCategory(),
    websiteEmoji: item.getWebsiteEmoji(),
    websiteSortOrder: item.getWebsiteSortOrder(),
    memberPrice: item.getMemberPrice()?.toString() ?? null,
    nonMemberPrice: item.getNonMemberPrice()?.toString() ?? null,
    publishedToWebsite: item.getPublishedToWebsite(),
    priceVariables: (item.getPriceVariables() ?? []).map(priceVariableToDTO),
    createdAt: item.getCreatedAt().toISOString(),
});

export const itemsToDTO = (items: Item[]): ItemDTO[] => items.map(itemToDTO);
