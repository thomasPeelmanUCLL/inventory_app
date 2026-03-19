import useSWR from 'swr';
import {
    getAllItems,
    getItemById,
    getItemsByInventoryId,
    createItem,
    updateItem,
    deleteItem,
} from '../lib/api';
import { Item } from '../types';

export function useItems() {
    const {
        data: items,
        error,
        mutate,
        isLoading,
    } = useSWR('/items', getAllItems, {
        revalidateOnFocus: true,
        dedupingInterval: 3000,
        errorRetryCount: 3,
    });

    const create = async (data: {
        name: string;
        description: string;
        buyPrice: number;
        quantity: number;
        buyedAt?: string;
        inventoryId?: number;
        priceVariables?: Array<{ name: string; value: number; type: string; isDefault?: boolean }>;
    }) => {
        try {
            const newItem = await createItem(data);
            mutate([...(items || []), newItem], false);
            return newItem;
        } catch (error) {
            mutate();
            throw error;
        }
    };

    const update = async (
        itemId: number,
        data: {
            name?: string;
            description?: string;
            buyPrice?: number;
            quantity?: number;
            buyedAt?: string;
            inventoryId?: number;
        },
    ) => {
        try {
            const updated = await updateItem(itemId, data);
            mutate(
                items?.map((item: Item) => (item.id === itemId ? { ...item, ...updated } : item)),
                false,
            );
            return updated;
        } catch (error) {
            mutate();
            throw error;
        }
    };

    const remove = async (itemId: number) => {
        try {
            await deleteItem(itemId);
            mutate(
                items?.filter((item: Item) => item.id !== itemId),
                false,
            );
        } catch (error) {
            mutate();
            throw error;
        }
    };

    return {
        items: items || [],
        error,
        isLoading,
        mutate,
        create,
        update,
        remove,
    };
}

export function useInventoryItems(inventoryId: number | null) {
    const {
        data: items,
        error,
        mutate,
        isLoading,
    } = useSWR(
        inventoryId ? `/items/inventory/${inventoryId}` : null,
        () => (inventoryId ? getItemsByInventoryId(inventoryId) : null),
        {
            revalidateOnFocus: true,
            dedupingInterval: 3000,
        },
    );

    const create = async (data: {
        name: string;
        description: string;
        buyPrice: number;
        quantity: number;
        buyedAt?: string;
    }) => {
        if (!inventoryId) throw new Error('No inventory selected');
        try {
            const newItem = await createItem({ ...data, inventoryId });
            mutate([...(items || []), newItem], false);
            return newItem;
        } catch (error) {
            mutate();
            throw error;
        }
    };

    const update = async (
        itemId: number,
        data: {
            name?: string;
            description?: string;
            buyPrice?: number;
            quantity?: number;
            buyedAt?: string;
        },
    ) => {
        try {
            const updated = await updateItem(itemId, data);
            mutate(
                items?.map((item: Item) => (item.id === itemId ? { ...item, ...updated } : item)),
                false,
            );
            return updated;
        } catch (error) {
            mutate();
            throw error;
        }
    };

    const remove = async (itemId: number) => {
        try {
            await deleteItem(itemId);
            mutate(
                items?.filter((item: Item) => item.id !== itemId),
                false,
            );
        } catch (error) {
            mutate();
            throw error;
        }
    };

    return {
        items: items || [],
        error,
        isLoading,
        mutate,
        create,
        update,
        remove,
    };
}

export function useItem(itemId: number | null) {
    const {
        data: item,
        error,
        mutate,
        isLoading,
    } = useSWR(itemId ? `/items/${itemId}` : null, () => (itemId ? getItemById(itemId) : null), {
        revalidateOnFocus: false,
        dedupingInterval: 10000,
    });

    return {
        item,
        error,
        isLoading,
        mutate,
    };
}
