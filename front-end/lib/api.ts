import {PriceVariable} from "@types";

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

// Inventory APIs
export async function getInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys`);
    if (!response.ok) throw new Error('Failed to fetch inventories');
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

// Item APIs
export async function createItem(inventoryId: number, data: any) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            inventoryId: inventoryId
        }),
    });
    if (!response.ok) throw new Error('Failed to create item');
    return response.json();
}


export async function updateItem(itemId: number, data: any) {
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

// User Management APIs
export async function addUserToInventory(inventoryId: number, data: { email: string; role: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add user');
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove user');
}

export async function updateUserRole(inventoryId: number, userId: number, role: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
    });
    if (!response.ok) throw new Error('Failed to update user role');
    return response.json();
}

// Sold Items APIs
export async function sellItems(inventoryId: number, data: any) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems`, {
        method: 'POST',
        body: JSON.stringify({
            ...data,
            inventoryId: inventoryId
        }),
    });
    if (!response.ok) throw new Error('Failed to sell items');
    return response.json();
}

export async function getSoldItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/inventory/${inventoryId}`);
    if (!response.ok) throw new Error('Failed to fetch sold items');
    return response.json();
}

// Price Variables APIs
export async function getPriceVariablesByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/inventory/${inventoryId}`);
    if (!response.ok) throw new Error('Failed to fetch price variables');
    return response.json();
}

export const createPriceVariable = async (
    inventoryId: number,
    data: {
        name: string;
        value: number;
        type: string;
        isDefault: boolean;
        inventoryId: number;
    }
): Promise<PriceVariable> => {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`, {  // ← USE fetchWithAuth
        method: 'POST',
        body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create price variable');
    return response.json();
};

export async function getMyInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/my`);
    if (!response.ok) throw new Error('Failed to fetch my inventories');
    return response.json();
}




export async function updatePriceVariable(variableId: number, data: { name: string; formula: string }) {
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

// User Search API
export async function searchUsers(query: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/search?query=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to search users');
    return response.json();
}
