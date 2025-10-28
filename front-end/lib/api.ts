import { PriceVariable } from "@types";

const API_BASE_URL = 'http://localhost:3000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    const response = await fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    return response;
}

// ========================================
// INVENTORY APIs
// ========================================

export async function getAllInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys`);
    if (!response.ok) throw new Error('Failed to fetch inventories');
    return response.json();
}

export async function getMyInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/my`);
    if (!response.ok) throw new Error('Failed to fetch my inventories');
    return response.json();
}

export async function getInventoryById(id: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    return response.json();
}

export async function createInventory(data: { name: string; description: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create inventory');
    return response.json();
}

export async function updateInventory(id: number, data: { name: string; description: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update inventory');
    return response.json();
}

export async function deleteInventory(id: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete inventory');
}

// ========================================
// INVENTORY USER MANAGEMENT APIs
// ========================================

export async function getInventoryUsers(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`);
    if (!response.ok) throw new Error('Failed to fetch inventory users');
    return response.json();
}

export async function addUserToInventory(inventoryId: number, data: { email: string; role: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add user');
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: string) {  // ✅ FIXED: string not number
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove user');
}

export async function updateUserRole(inventoryId: number, userId: string, role: string) {  // ✅ FIXED: string not number
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
}

// ========================================
// ITEM APIs
// ========================================

export async function getAllItems() {
    const response = await fetchWithAuth(`${API_BASE_URL}/items`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
}

export async function getItemById(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch item');
    return response.json();
}

export async function getItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/inventory/${inventoryId}`);
    if (!response.ok) throw new Error('Failed to fetch items');
    return response.json();
}

export async function createItem(data: {
    name: string;
    description: string;
    buyPrice: number;
    quantity: number;
    buyedAt?: string;
    inventoryId?: number;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return response.json();
}

export async function updateItem(itemId: number, data: {
    name?: string;
    description?: string;
    buyPrice?: number;
    quantity?: number;
    buyedAt?: string;
    inventoryId?: number;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update item');
    return response.json();
}

export async function deleteItem(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete item');
}

// ========================================
// PRICE VARIABLE APIs
// ========================================

export async function getAllPriceVariables() {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`);
    if (!response.ok) throw new Error('Failed to fetch price variables');
    return response.json();
}

export async function getPriceVariableById(variableId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${variableId}`);
    if (!response.ok) throw new Error('Failed to fetch price variable');
    return response.json();
}

// ✅ FIXED: Changed from inventory to item
export async function getPriceVariablesByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/item/${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch price variables');
    return response.json();
}

// ✅ FIXED: Changed parameter from inventoryId to itemId, updated data structure
export async function createPriceVariable(
    itemId: number,
    data: {
        name: string;
        value: number;
        type: 'PERCENTAGE' | 'FIXED';
        isDefault: boolean;
    }
): Promise<PriceVariable> {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            itemId: itemId
        }),
    });
    if (!response.ok) throw new Error('Failed to create price variable');
    return response.json();
}

// ✅ FIXED: Changed from formula to value, type, isDefault
export async function updatePriceVariable(variableId: number, data: {
    name?: string;
    value?: number;
    type?: 'PERCENTAGE' | 'FIXED';
    isDefault?: boolean;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${variableId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update price variable');
    return response.json();
}

export async function deletePriceVariable(variableId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${variableId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete price variable');
}

// ========================================
// SOLD ITEM APIs
// ========================================

export async function getAllSoldItems() {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

export async function getSoldItemById(soldItemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`);
    if (!response.ok) throw new Error('Failed to fetch sold item');
    return response.json();
}

export async function getSoldItemsByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/item/${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

export async function getSoldItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/inventory/${inventoryId}`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

// ✅ FIXED: Changed to match backend expectations (itemId, not inventoryId)
export async function createSoldItem(data: {
    itemId: number;
    finalSellPrice: number;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    soldAt?: string;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create sold item');
    return response.json();
}

export async function updateSoldItem(soldItemId: number, data: {
    finalSellPrice?: number;
    quantity?: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    soldAt?: string;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update sold item');
    return response.json();
}

export async function deleteSoldItem(soldItemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete sold item');
}

// ========================================
// USER APIs
// ========================================

// ✅ FIXED: Using correct backend endpoint
export async function searchUsersByEmail(email: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
}

export async function getUserById(userId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
}

export async function getUserByName(name: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/name/${name}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
}

export async function getAllUsers() {
    const response = await fetchWithAuth(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

