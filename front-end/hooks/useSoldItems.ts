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

// Minimal DTO shapes used by this hook layer
export type SoldItemDTO = {
  id: number;
  itemId: number;
  finalSellPrice: number | string;
  priceVariableName?: string | null;
  isCustomPrice?: boolean;
  payedCash?: boolean;
  quantity: number;
  soldAt?: string;
};

export type InventoryAnalyticsDTO = any; // callers have their own typing; keep flexible

// Hook for all user-accessible sold items
export function useSoldItems() {
  const {
    data: soldItems,
    error,
    mutate,
    isLoading,
  } = useSWR<SoldItemDTO[]>('/soldItems', getAllSoldItems, {
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
      const itemWithDate: SoldItemDTO = {
        ...newSoldItem,
        soldAt: newSoldItem.soldAt || new Date().toISOString(),
      };
      await mutate([itemWithDate, ...((soldItems as SoldItemDTO[] | undefined) || [])], { revalidate: false });
      return newSoldItem;
    } catch (err) {
      await mutate();
      throw err;
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
      await mutate(
        (soldItems || []).map((item: SoldItemDTO) => item.id === soldItemId ? { ...item, ...updated } : item),
        { revalidate: false }
      );
      return updated;
    } catch (err) {
      await mutate();
      throw err;
    }
  };

  const remove = async (soldItemId: number) => {
    try {
      await deleteSoldItem(soldItemId);
      await mutate(
        (soldItems || []).filter((item: SoldItemDTO) => item.id !== soldItemId),
        { revalidate: false }
      );
    } catch (err) {
      await mutate();
      throw err;
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
  } = useSWR<SoldItemDTO[]>(
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
      const itemWithDate: SoldItemDTO = {
        ...newSoldItem,
        soldAt: newSoldItem.soldAt || new Date().toISOString(),
      };
      await mutate([itemWithDate, ...((soldItems as SoldItemDTO[] | undefined) || [])], { revalidate: false });
      return newSoldItem;
    } catch (err) {
      await mutate();
      throw err;
    }
  };

  const update = async (soldItemId: number, data: Partial<SoldItemDTO>) => {
    try {
      const updated = await updateSoldItem(soldItemId, data);
      await mutate(
        (soldItems || []).map((item: SoldItemDTO) => item.id === soldItemId ? { ...item, ...updated } : item),
        { revalidate: false }
      );
      return updated;
    } catch (err) {
      await mutate();
      throw err;
    }
  };

  const remove = async (soldItemId: number) => {
    try {
      await deleteSoldItem(soldItemId);
      await mutate(
        (soldItems || []).filter((item: SoldItemDTO) => item.id !== soldItemId),
        { revalidate: false }
      );
    } catch (err) {
      await mutate();
      throw err;
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
  } = useSWR<SoldItemDTO[]>(
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
  } = useSWR<SoldItemDTO | null>(
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
  } = useSWR<InventoryAnalyticsDTO>(
    cacheKey,
    () => inventoryId ? getInventoryAnalytics(inventoryId, startDate, endDate) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      errorRetryCount: 2,
    }
  );

  const refresh = async () => { await mutate(); };

  return {
    analytics,
    error,
    isLoading,
    refresh,
  };
}
