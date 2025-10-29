import useSWR from 'swr';
import {
  getAllSoldItems,
  getSoldItemById,
  getSoldItemsByInventoryId,
  getSoldItemsByItemId,
  createSoldItem,
  updateSoldItem,
  deleteSoldItem,
  getInventoryAnalytics,
} from '../lib/api';

// Hook for all user-accessible sold items
export function useSoldItems() {
  const {
    data: soldItems,
    error,
    mutate,
    isLoading,
  } = useSWR('/soldItems', getAllSoldItems, {
    revalidateOnFocus: true,
    dedupingInterval: 3000,
    errorRetryCount: 3,
  });

  const create = async (data: {
    itemId: number;
    finalSellPrice: number;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    soldAt?: string;
  }) => {
    try {
      const newSoldItem = await createSoldItem(data);
      // Add to cache with current timestamp if no soldAt provided
      const itemWithDate = {
        ...newSoldItem,
        soldAt: newSoldItem.soldAt || new Date().toISOString(),
      };
      mutate([itemWithDate, ...(soldItems || [])], false); // Add to top (newest first)
      return newSoldItem;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const update = async (soldItemId: number, data: {
    finalSellPrice?: number;
    quantity?: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    soldAt?: string;
  }) => {
    try {
      const updated = await updateSoldItem(soldItemId, data);
      mutate(
        soldItems?.map(item => item.id === soldItemId ? { ...item, ...updated } : item),
        false
      );
      return updated;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const remove = async (soldItemId: number) => {
    try {
      await deleteSoldItem(soldItemId);
      mutate(
        soldItems?.filter(item => item.id !== soldItemId),
        false
      );
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    soldItems: soldItems || [],
    error,
    isLoading,
    mutate,
    create,
    update,
    remove,
  };
}

// Hook for sold items in specific inventory
export function useInventorySoldItems(inventoryId: number | null) {
  const {
    data: soldItems,
    error,
    mutate,
    isLoading,
  } = useSWR(
    inventoryId ? `/soldItems/inventory/${inventoryId}` : null,
    () => inventoryId ? getSoldItemsByInventoryId(inventoryId) : null,
    {
      revalidateOnFocus: true,
      dedupingInterval: 3000,
    }
  );

  const create = async (data: {
    itemId: number;
    finalSellPrice: number;
    quantity: number;
    priceVariableName?: string;
    isCustomPrice?: boolean;
    payedCash?: boolean;
    soldAt?: string;
  }) => {
    try {
      const newSoldItem = await createSoldItem(data);
      const itemWithDate = {
        ...newSoldItem,
        soldAt: newSoldItem.soldAt || new Date().toISOString(),
      };
      mutate([itemWithDate, ...(soldItems || [])], false);
      return newSoldItem;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const update = async (soldItemId: number, data: any) => {
    try {
      const updated = await updateSoldItem(soldItemId, data);
      mutate(
        soldItems?.map(item => item.id === soldItemId ? { ...item, ...updated } : item),
        false
      );
      return updated;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const remove = async (soldItemId: number) => {
    try {
      await deleteSoldItem(soldItemId);
      mutate(
        soldItems?.filter(item => item.id !== soldItemId),
        false
      );
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    soldItems: soldItems || [],
    error,
    isLoading,
    mutate,
    create,
    update,
    remove,
  };
}

// Hook for sold items by specific item
export function useItemSoldItems(itemId: number | null) {
  const {
    data: soldItems,
    error,
    mutate,
    isLoading,
  } = useSWR(
    itemId ? `/soldItems/item/${itemId}` : null,
    () => itemId ? getSoldItemsByItemId(itemId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  return {
    soldItems: soldItems || [],
    error,
    isLoading,
    mutate,
  };
}

// Hook for single sold item
export function useSoldItem(soldItemId: number | null) {
  const {
    data: soldItem,
    error,
    mutate,
    isLoading,
  } = useSWR(
    soldItemId ? `/soldItems/${soldItemId}` : null,
    () => soldItemId ? getSoldItemById(soldItemId) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  return {
    soldItem,
    error,
    isLoading,
    mutate,
  };
}

// Hook for inventory analytics
export function useInventoryAnalytics(
  inventoryId: number | null,
  startDate?: Date,
  endDate?: Date
) {
  const cacheKey = inventoryId 
    ? `/soldItems/inventory/${inventoryId}/analytics?${startDate?.toISOString().split('T')[0] || 'no-start'}-${endDate?.toISOString().split('T')[0] || 'no-end'}`
    : null;

  const {
    data: analytics,
    error,
    mutate,
    isLoading,
  } = useSWR(
    cacheKey,
    () => inventoryId ? getInventoryAnalytics(inventoryId, startDate, endDate) : null,
    {
      revalidateOnFocus: false, // Analytics are expensive, don't auto-refresh
      dedupingInterval: 30000, // Cache for 30 seconds
      errorRetryCount: 2,
    }
  );

  const refresh = () => mutate();

  return {
    analytics,
    error,
    isLoading,
    refresh,
  };
}
