// Enhanced API client with better error handling and authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Enhanced fetch with comprehensive error handling
async function fetchWithAuth(url: string, options: RequestInit = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            credentials: 'include', // Critical for Better Auth cookies
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
        
        // Handle different types of errors from the secure backend
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}`;
            let errorDetails = null;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorData.message || errorMessage;
                errorDetails = errorData.details;
            } catch {
                // If JSON parsing fails, use status text
                errorMessage = response.statusText || errorMessage;
            }
            
            // Handle specific status codes
            switch (response.status) {
                case 401:
                    // Redirect to login or show auth error
                    if (typeof window !== 'undefined') {
                        console.warn('🔐 Authentication required - redirecting to login');
                        window.location.href = '/login';
                    }
                    throw new Error('Authentication required');
                case 403:
                    throw new Error(`Access denied: ${errorMessage}`);
                case 404:
                    throw new Error(`Not found: ${errorMessage}`);
                case 429:
                    throw new Error(`Rate limited: ${errorMessage}`);
                case 400:
                    if (errorDetails) {
                        // Zod validation errors
                        const validationErrors = Array.isArray(errorDetails) 
                            ? errorDetails.map(e => `${e.field}: ${e.message}`).join(', ')
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
// INVENTORY APIs
// ========================================

export async function getAllInventories() {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/my`); // Use /my endpoint
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

export async function updateInventory(id: number, data: { name?: string; description?: string }) {
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

export async function addUserToInventory(inventoryId: number, data: { userId: string; role: string }) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to add user');
    return response.json();
}

export async function removeUserFromInventory(inventoryId: number, userId: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/inventorys/${inventoryId}/users/${userId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to remove user');
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
// ANALYTICS API (Fixed date handling)
// ========================================
export async function getInventoryAnalytics(
    inventoryId: number,
    startDate?: Date,
    endDate?: Date
) {
    const params = new URLSearchParams();
    
    // Format dates as YYYY-MM-DD for better server parsing
    if (startDate) {
        const dateStr = startDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        params.append('startDate', dateStr);
    }
    if (endDate) {
        const dateStr = endDate.toISOString().split('T')[0]; // YYYY-MM-DD format
        params.append('endDate', dateStr);
    }

    const queryString = params.toString();
    const url = `${API_BASE_URL}/soldItems/inventory/${inventoryId}/analytics${queryString ? `?${queryString}` : ''}`;

    console.log('📊 Analytics URL:', url); // Debug log
    
    const response = await fetchWithAuth(url);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    return response.json();
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

export async function getPriceVariablesByItemId(itemId: number) {
    const response = await fetchWithAuth(`${API_BASE_URL}/priceVariables/item/${itemId}`);
    if (!response.ok) throw new Error('Failed to fetch price variables');
    return response.json();
}

export async function createPriceVariable(
    itemId: number,
    data: {
        name: string;
        value: number;
        type: 'PERCENTAGE' | 'FIXED';
        isDefault: boolean;
    }
) {
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
// USER APIs
// ========================================

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

export async function getAllUsers() {
    const response = await fetchWithAuth(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
}

// ========================================
// AUTH APIs (Better Auth integration)
// ========================================

export async function getCurrentSession() {
    try {
        const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/get-session`);
        if (!response.ok) return null; // Not authenticated
        return response.json();
    } catch {
        return null; // Network error or not authenticated
    }
}

export async function signIn(email: string, password: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-in/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });
    if (!response.ok) throw new Error('Failed to sign in');
    return response.json();
}

export async function signOut() {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-out`, {
        method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to sign out');
    return response.json();
}

export async function signUp(email: string, password: string, name: string) {
    const response = await fetchWithAuth(`${API_BASE_URL}/api/auth/sign-up/email`, {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
    });
    if (!response.ok) throw new Error('Failed to sign up');
    return response.json();
}
