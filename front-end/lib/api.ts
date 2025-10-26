import { authClient } from './auth-client';
import {Item, SoldItem} from "@types";

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const sessionData = await authClient.getSession();

    if (!sessionData?.data?.user) {
        throw new Error('Not authenticated');
    }

    // Don't send Authorization header - cookies handle auth automatically
    const headers = {
        ...options.headers,
        'Content-Type': 'application/json',
    };

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // This sends the session cookie
    });
}

// Inventory endpoints - FIXED TO PLURAL
export async function getMyInventories() {
    const response = await fetchWithAuth('http://localhost:3000/inventorys/my');
    if (!response.ok) throw new Error('Failed to fetch inventories');
    return response.json();
}

export async function getInventoryById(id: number) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${id}`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
}

export async function createInventory(data: { name: string; description: string }) {
    const response = await fetchWithAuth('http://localhost:3000/inventorys', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create inventory');
    return response.json();
}

export async function updateInventory(id: number, data: { name: string; description: string }) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    return response.json();
}

export async function deleteInventory(id: number) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete inventory');
}

// User management
export async function getInventoryUsers(inventoryId: number) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${inventoryId}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

export async function addUserToInventory(inventoryId: number, userId: string, role: string) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) throw new Error('Failed to add user');
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: string) {
    const response = await fetchWithAuth(`http://localhost:3000/inventorys/${inventoryId}/users/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove user');
}

export async function getAllUsers() {
    const response = await fetchWithAuth('http://localhost:3000/users');
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

// Item endpoints - FIXED TO PLURAL
export async function getAllItems() {
    const response = await fetchWithAuth('http://localhost:3000/items');
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
}

export async function getItemById(id: number) {
    const response = await fetchWithAuth(`http://localhost:3000/items/${id}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return response.json();
}

export async function createItem(data: Item) {
    const response = await fetchWithAuth('http://localhost:3000/items', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return response.json();
}

export async function updateItem(id: number, data: Item) {
    const response = await fetchWithAuth(`http://localhost:3000/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
}

export async function deleteItem(id: number) {
    const response = await fetchWithAuth(`http://localhost:3000/items/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
}

// Sold Item endpoints - FIXED TO PLURAL
export async function getAllSoldItems() {
    const response = await fetchWithAuth('http://localhost:3000/soldItems');
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

export async function getSoldItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`http://localhost:3000/soldItems/inventory/${inventoryId}`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

export async function getSoldItemsByItemId(itemId: number) {
    const response = await fetchWithAuth(`http://localhost:3000/soldItems/item/${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

export async function getLastSoldPrice(itemId: number) {
    const response = await fetchWithAuth(`http://localhost:3000/soldItems/item/${itemId}/last-price`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.lastPrice;
}

export async function createSoldItem(data: SoldItem) {
    const response = await fetchWithAuth('http://localhost:3000/soldItems', {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create sold item');
    return response.json();
}

export async function updateSoldItem(id: number, data: SoldItem) {
    const response = await fetchWithAuth(`http://localhost:3000/soldItems/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update sold item');
    return response.json();
}

export async function deleteSoldItem(id: number) {
    const response = await fetchWithAuth(`http://localhost:3000/soldItems/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete sold item');
}
