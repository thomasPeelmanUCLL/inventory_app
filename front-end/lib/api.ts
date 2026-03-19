// All non-auth API calls go through Next.js rewrite -> pod-to-pod to backend
// Auth calls (better-auth) still use NEXT_PUBLIC_API_URL directly from the browser
function normalizeBaseUrl(rawValue?: string): string {
    const value = (rawValue || '').trim();
    if (!value) return 'http://localhost:3000';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `http://${value}`;
}

const API_BASE_URL =
    typeof window !== 'undefined'
        ? '/api/backend' // browser: routed through Next.js rewrite -> internal backend
        : normalizeBaseUrl(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL); // SSR: direct

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
            let validationDetails = null;

            try {
                const errorBody = await response.json();
                errorMessage = errorBody.error || errorBody.message || errorMessage;
                validationDetails = errorBody.details;
            } catch {
                errorMessage = response.statusText || errorMessage;
            }

            switch (response.status) {
                case 401:
                    if (typeof window !== 'undefined') window.location.href = '/Login';
                    throw new Error('Authentication required');
                case 403:
                    throw new Error(`Access denied: ${errorMessage}`);
                case 404:
                    throw new Error(`Not found: ${errorMessage}`);
                case 429:
                    throw new Error(`Rate limited: ${errorMessage}`);
                case 400:
                    if (validationDetails) {
                        const fieldErrors = Array.isArray(validationDetails)
                            ? validationDetails
                                  .map(
                                      (fieldError: any) =>
                                          `${fieldError.field}: ${fieldError.message}`,
                                  )
                                  .join(', ')
                            : errorMessage;
                        throw new Error(`Validation failed: ${fieldErrors}`);
                    }
                    throw new Error(`Bad request: ${errorMessage}`);
                default:
                    throw new Error(errorMessage);
            }
        }

        return response;
    } catch (networkError) {
        if (networkError instanceof TypeError && networkError.message.includes('fetch')) {
            throw new Error('Network error - ensure backend is running');
        }
        throw networkError;
    }
}

// ========================================
// INVENTORY
// ========================================

export async function getMyInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/my`);
    return response.json();
}

export async function getInventoryById(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}`);
    return response.json();
}

export async function createInventory(inventoryData: { name: string; description: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys`, {
        method: 'POST',
        body: JSON.stringify(inventoryData),
    });
    return response.json();
}

export async function updateInventory(
    inventoryId: number,
    inventoryData: { name?: string; description?: string },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData),
    });
    return response.json();
}

export async function deleteInventory(inventoryId: number) {
    await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}`, { method: 'DELETE' });
}

// ========================================
// INVENTORY USER MANAGEMENT
// ========================================

export async function getInventoryUsers(inventoryId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`);
    return response.json();
}

export async function addUserToInventory(
    inventoryId: number,
    userInviteData: { email: string; role: string },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify(userInviteData),
    });
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: string) {
    await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'DELETE',
    });
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

export async function createItem(itemData: {
    name: string;
    description: string;
    buyPrice: number;
    quantity: number;
    purchasedAt?: string;
    inventoryId?: number;
    priceVariables?: Array<{ name: string; value: number; type: string; isDefault?: boolean }>;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items`, {
        method: 'POST',
        body: JSON.stringify(itemData),
    });
    return response.json();
}

export async function updateItem(
    itemId: number,
    itemData: {
        name?: string;
        description?: string;
        buyPrice?: number;
        quantity?: number;
        purchasedAt?: string;
        inventoryId?: number;
    },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/items/${itemId}`, {
        method: 'PUT',
        body: JSON.stringify(itemData),
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

export async function createSoldItem(saleData: {
    itemId: number;
    finalSellPrice: number;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    paidWithCash?: boolean;
    soldAt?: string;
}) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems`, {
        method: 'POST',
        body: JSON.stringify(saleData),
    });
    return response.json();
}

export async function updateSoldItem(
    soldItemId: number,
    saleData: {
        finalSellPrice?: number;
        quantity?: number;
        priceVariableName?: string;
        isCustomPrice?: boolean;
        paidWithCash?: boolean;
        soldAt?: string;
    },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/soldItems/${soldItemId}`, {
        method: 'PUT',
        body: JSON.stringify(saleData),
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
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate.toISOString().split('T')[0]);
    if (endDate) queryParams.append('endDate', endDate.toISOString().split('T')[0]);
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/soldItems/inventory/${inventoryId}/analytics${queryString ? `?${queryString}` : ''}`;
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

export async function getPriceVariableById(priceVariableId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${priceVariableId}`);
    return response.json();
}

export async function getPriceVariablesByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/item/${itemId}`);
    return response.json();
}

export async function createPriceVariable(
    itemId: number,
    priceVariableData: {
        name: string;
        value: number;
        type: 'PERCENTAGE' | 'FIXED';
        isDefault: boolean;
    },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables`, {
        method: 'POST',
        body: JSON.stringify({ ...priceVariableData, itemId }),
    });
    return response.json();
}

export async function updatePriceVariable(
    priceVariableId: number,
    priceVariableData: {
        name?: string;
        value?: number;
        type?: 'PERCENTAGE' | 'FIXED';
        isDefault?: boolean;
    },
) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/${priceVariableId}`, {
        method: 'PUT',
        body: JSON.stringify(priceVariableData),
    });
    return response.json();
}

export async function deletePriceVariable(priceVariableId: number) {
    await fetchWithAuth(`${API_BASE_URL}/priceVariables/${priceVariableId}`, { method: 'DELETE' });
}

// ========================================
// USERS
// ========================================

export async function searchUsersByEmail(email: string) {
    const response = await fetchWithAuth(
        `${API_BASE_URL}/users?email=${encodeURIComponent(email)}`,
    );
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
// AUTH (kept separate - better-auth handles these directly)
// ========================================

export async function getCurrentSession() {
    const authUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    try {
        const response = await fetchWithAuth(`${authUrl}/api/auth/get-session`);
        return response.json();
    } catch {
        return null;
    }
}

export async function signIn(email: string, password: string) {
    const authUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetchWithAuth(`${authUrl}/api/auth/sign-in/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    return response.json();
}

export async function signOut() {
    const authUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetchWithAuth(`${authUrl}/api/auth/sign-out`, { method: 'POST' });
    return response.json();
}

export async function signUp(email: string, password: string, name: string) {
    const authUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
    const response = await fetchWithAuth(`${authUrl}/api/auth/sign-up/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
    });
    return response.json();
}
