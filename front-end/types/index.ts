type Role = "admin" | "user";

export interface RegisterUserData {
  email: string;
  password: string;
  name: string;
  age: number;
  role: string;
}

export interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  inventoryId?: number;
}


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
};

export interface NewItemForm {
  name: string;
  description: string;
  price: number;
  quantity: number;
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

export interface Item {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  buyedAt?: Date;
  inventoryId?: number;
  createdAt: Date;
}

export interface SoldItem {
  id: number;
  itemId: number;
  sellingPrice: number;
  quantity: number;
  payedCash: boolean;
  soldAt?: Date;
  createdAt: Date;
  item?: Item;
}

export interface InventoryUser {
  userId: string;
  inventoryId: number;
  role: 'owner' | 'editor' | 'viewer';
  user?: User;
};

export type CartItem = {
  item: Item;
  quantityToSell: number;
  sellingPrice: number;
};

export type SellModalData = {
  item: Item;
  quantity: number;
  price: number;
  paymentMethod: 'cash' | 'card';
};


