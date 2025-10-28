type Role = "admin" | "user";

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  age: number;
  role: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  role: 'admin' | 'user' | 'guest';
  age?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ✅ FIXED: Removed priceVariableId, added priceVariables array
export interface Item {
  id?: number;
  name: string;
  description: string;
  buyPrice: number;
  quantity: number;
  buyedAt?: Date;
  inventoryId?: number;
  priceVariables?: PriceVariable[]; // ✅ ADDED - Backend returns this
  createdAt?: Date;
  updatedAt?: Date;
}

export type CreateItemInput = Omit<Item, 'id' | 'createdAt' | 'updatedAt' | 'priceVariables'>;

export interface SoldItem {
  id?: number;
  itemId: number;
  finalSellPrice: number;
  priceVariableName?: string;
  isCustomPrice?: boolean;
  quantity: number;
  payedCash: boolean;
  soldAt: Date;
  item?: Item;
}

export type CreateSoldItemInput = Omit<SoldItem, 'id' | 'soldAt' | 'item'>;

// ✅ FIXED: Changed inventoryId to itemId
export type PriceVariable = {
  id: number;
  name: string;
  value: number;
  type: 'PERCENTAGE' | 'FIXED';
  isDefault: boolean;
  itemId: number; // ✅ FIXED: was inventoryId
  createdAt?: string;
  updatedAt?: string;
};

export type Inventory = {
  id: number;
  name: string;
  description: string;
  items: Item[];
  users?: Array<{
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
  createdAt?: Date;
  updatedAt?: Date;
};

export interface InventoryUser {
  userId: string;
  inventoryId: number;
  role: 'owner' | 'editor' | 'viewer';
  user?: User;
  addedAt?: Date;
}

// ✅ FIXED: Removed priceVariableId
export interface NewItemForm {
  name: string;
  description: string;
  buyPrice: number;
  quantity: number;
  buyedAt?: Date;
}

export type CartItem = {
  item: Item;
  quantityToSell: number;
  finalSellPrice: number;
  priceVariableName?: string;
  isCustomPrice?: boolean;
};

export type SellModalData = {
  item: Item;
  quantity: number;
  finalSellPrice: number;
  priceVariableName?: string;
  isCustomPrice?: boolean;
  paymentMethod: 'cash' | 'card';
};
