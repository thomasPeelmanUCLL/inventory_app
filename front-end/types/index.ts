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

export interface Inventory {
  id: number;
  name: string;
  description: string;
  items?: Item[];
}

export interface NewItemForm {
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export interface SoldItem {
  id: number;
  itemId: number;
  sellingPrice: number;
  quantity: number;
  payedCash: boolean;
  soldAt: string;
  item?: Item;
}

