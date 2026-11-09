// Every non-auth call goes through the Next.js rewrite /api/backend/* -> backend (pod-to-pod).
// Auth lives in lib/auth-client.ts (better-auth).
import type { InventoryRole, PaymentMethod, PriceVariableType } from '@types';

function normalizeBaseUrl(rawValue?: string): string {
    const value = (rawValue || '').trim();
    if (!value) return 'http://localhost:3000';
    if (value.startsWith('http://') || value.startsWith('https://')) return value;
    return `https://${value}`;
}

const API_BASE_URL =
    typeof window !== 'undefined'
        ? '/api/backend'
        : normalizeBaseUrl(process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL);

type FieldError = { field: string; message: string };

/** Turns a failed response into an Error with a readable message. */
async function toError(response: Response): Promise<Error> {
    const body = await response.json().catch(() => null);
    const message: string = body?.error || body?.message || response.statusText || `HTTP ${response.status}`;
    switch (response.status) {
        case 401:
            if (typeof window !== 'undefined') window.location.href = '/login';
            return new Error('Authentication required');
        case 400: {
            const details: FieldError[] | undefined = Array.isArray(body?.details) ? body.details : undefined;
            return details
                ? new Error(`Validation failed: ${details.map((d) => `${d.field}: ${d.message}`).join(', ')}`)
                : new Error(`Bad request: ${message}`);
        }
        case 403:
            return new Error(`Access denied: ${message}`);
        case 404:
            return new Error(`Not found: ${message}`);
        case 429:
            return new Error(`Rate limited: ${message}`);
        default:
            return new Error(message);
    }
}

/** JSON request to the backend with the session cookie. Resolves to the parsed body (undefined for 204). */
async function request<T = void>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown,
): Promise<T> {
    let response: Response;
    try {
        response = await fetch(`${API_BASE_URL}${path}`, {
            method,
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
    } catch {
        throw new Error('Network error - ensure backend is running');
    }
    if (!response.ok) throw await toError(response);
    return response.status === 204 ? (undefined as T) : response.json();
}

// ---- Inventories ----

export const getMyInventories = () => request<any[]>('GET', '/inventorys/my');
export const getInventoryById = (inventoryId: number) => request<any>('GET', `/inventorys/${inventoryId}`);
export const createInventory = (data: { name: string; description: string }) =>
    request<any>('POST', '/inventorys', data);
export const deleteInventory = (inventoryId: number) => request('DELETE', `/inventorys/${inventoryId}`);

// ---- Inventory members ----

export const getInventoryUsers = (inventoryId: number) =>
    request<any[]>('GET', `/inventorys/${inventoryId}/users`);
export const addUserToInventory = (inventoryId: number, invite: { email: string; role: InventoryRole }) =>
    request('POST', `/inventorys/${inventoryId}/users`, invite);
export const removeUserFromInventory = (inventoryId: number, userId: string) =>
    request('DELETE', `/inventorys/${inventoryId}/users/${encodeURIComponent(userId)}`);

// ---- Items ----

export type ItemPayload = {
    name: string;
    description: string;
    buyPrice: number;
    quantity: number;
    /** Purchase date, YYYY-MM-DD or ISO. */
    buyedAt?: string;
    inventoryId?: number;
    websiteCategory?: string | null;
    websiteEmoji?: string | null;
    websiteSortOrder?: number;
    memberPrice?: number | null;
    nonMemberPrice?: number | null;
    publishedToWebsite?: boolean;
};

export const createItem = (item: ItemPayload) => request<any>('POST', '/items', item);
export const updateItem = (itemId: number, patch: Partial<ItemPayload>) =>
    request<any>('PUT', `/items/${itemId}`, patch);
export const deleteItem = (itemId: number) => request('DELETE', `/items/${itemId}`);

// ---- Sales ----

export type SalePayload = {
    itemId: number;
    finalSellPrice: number;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    paymentMethod: PaymentMethod;
};

export const getSoldItemsByInventoryId = (inventoryId: number) =>
    request<any[]>('GET', `/soldItems/inventory/${inventoryId}`);
export const createSoldItem = (sale: SalePayload) => request<any>('POST', '/soldItems', sale);
export const deleteSoldItem = (soldItemId: number) => request('DELETE', `/soldItems/${soldItemId}`);

/** Dates are sent as YYYY-MM-DD; the end date counts as the whole day. */
export function getInventoryAnalytics(inventoryId: number, startDate?: Date, endDate?: Date) {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate.toISOString().slice(0, 10));
    if (endDate) query.set('endDate', endDate.toISOString().slice(0, 10));
    const suffix = query.toString() ? `?${query}` : '';
    return request<any>('GET', `/soldItems/inventory/${inventoryId}/analytics${suffix}`);
}

// ---- Price variables ----

type PriceVariablePayload = { name: string; value: number; type: PriceVariableType; isDefault: boolean };

export const getPriceVariablesByItemId = (itemId: number) =>
    request<any[]>('GET', `/priceVariables/item/${itemId}`);
export const createPriceVariable = (itemId: number, data: PriceVariablePayload) =>
    request<any>('POST', '/priceVariables', { ...data, itemId });
export const updatePriceVariable = (priceVariableId: number, patch: Partial<PriceVariablePayload>) =>
    request<any>('PUT', `/priceVariables/${priceVariableId}`, patch);
export const deletePriceVariable = (priceVariableId: number) =>
    request('DELETE', `/priceVariables/${priceVariableId}`);

// ---- Users ----

export const getAllUsers = () => request<any[]>('GET', '/users');
