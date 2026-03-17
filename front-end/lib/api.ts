// API client with authentication and error handling
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            let errorDetails = null;

            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = errorData.details;
            } catch {
                errorMessage = response.statusText || errorMessage;
            }

            switch (response.status) {
                case 401:
                    if (typeof window !== 'undefined') window.location.href = '/login';
                    throw new Error('Authentication required');
                case 403:
                    throw new Error(`Access denied: ${errorMessage}`);
                case 404:
                    throw new Error(`Not found: ${errorMessage}`);
                case 429:
                    throw new Error(`Rate limited: ${errorMessage}`);
                case 400:
                    if (errorDetails) {
                        const validationErrors = Array.isArray(errorDetails)
                            ? errorDetails.map((e: any) => `${e.field}: ${e.message}`).join(', ')
                            : errorMessage;
                        throw new Error(`Validation failed: ${validationErrors}`);
                    }
                    throw new Error(`Bad request: ${errorMessage}`);
                default:
                    throw new Error(errorMessage);
            }
        }

        return response;
    } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error('Network error - ensure backend is running on ' + API_BASE_URL);
        }
        throw error;
    }
}

// ========================================
// INVENTORY
// ========================================

export async function getMyInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/my`);
    return response.json();
}

export async function getInventoryById(id: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`);
    return response.json();
}

export async function createInventory(data: { name: string; description: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function updateInventory(id: number, data: { name?: string; description?: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function deleteInventory(id: number) {
    await fetchWithAuth(`${API_BASE_URL}/inventorys/${id}`, { method: 'DELETE' });
}

// ========================================
// INVENTORY USER MANAGEMENT
// ========================================

export async function getInventoryUsers(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`);
    return response.json();
}

export async function addUserToInventory(inventoryId: number, data: { userId: string; role: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: string) {
    await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, { method: 'DELETE' });
}

// ========================================
// ITEMS
// ========================================

export async function getAllItems() {
    const response = await fetchWithAuth(`${API_BASE_URL}/items`);
    return response.json();
}

export async function getItemById(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`);
    return response.json();
}

export async function getItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/inventory/${inventoryId}`);
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
    return response.json();
}

export async function deleteItem(itemId: number) {
    await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`, { method: 'DELETE' });
}

// ========================================
// SOLD ITEMS
// ========================================

export async function getAllSoldItems() {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems`);
    return response.json();
}

export async function getSoldItemById(soldItemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`);
    return response.json();
}

export async function getSoldItemsByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/item/${itemId}`);
    return response.json();
}

export async function getSoldItemsByInventoryId(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/inventory/${inventoryId}`);
    return response.json();
}

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
    return response.json();
}

export async function deleteSoldItem(soldItemId: number) {
    await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`, { method: 'DELETE' });
}

// ========================================
// ANALYTICS
// ========================================

export async function getInventoryAnalytics(inventoryId: number, startDate?: Date, endDate?: Date) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) params.append('endDate', endDate.toISOString().split('T')[0]);
    const qs = params.toString();
    const url = `${API_BASE_URL}/soldItems/inventory/${inventoryId}/analytics${qs ? `?${qs}` : ''}`;
    const response = await fetchWithAuth(url);
    return response.json();
}

// ========================================
// PRICE VARIABLES
// ========================================

export async function getAllPriceVariables() {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`);
    return response.json();
}

export async function getPriceVariableById(variableId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${variableId}`);
    return response.json();
}

export async function getPriceVariablesByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/item/${itemId}`);
    return response.json();
}

export async function createPriceVariable(itemId: number, data: {
    name: string;
    value: number;
    type: 'PERCENTAGE' | 'FIXED';
    isDefault: boolean;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`, {
        method: 'POST',
        body: JSON.stringify({ ...data, itemId }),
    });
    return response.json();
}

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
    return response.json();
}

export async function deletePriceVariable(variableId: number) {
    await fetchWithAuth(`${API_BASE_URL}/priceVariables/${variableId}`, { method: 'DELETE' });
}

// ========================================
// USERS
// ========================================

export async function searchUsersByEmail(email: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users?email=${encodeURIComponent(email)}`);
    return response.json();
}

export async function getUserById(userId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/users/${userId}`);
    return response.json();
}

export async function getAllUsers() {
    const response = await fetchWithAuth(`${API_BASE_URL}/users`);
    return response.json();
}

// ========================================
// AUTH
// ========================================

export async function getCurrentSession() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/get-session`);
        return response.json();
    } catch {
        return null;
    }
}

export async function signIn(email: string, password: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function signOut() {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-out`, { method: 'POST' });
    return response.json();
}

export async function signUp(email: string, password: string, name: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
    });
    return response.json();
}
