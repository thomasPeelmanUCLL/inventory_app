import useSWR from 'swr';
import { getMyInventories, getInventoryById, createInventory, updateInventory, deleteInventory } from '../lib/api';

export function useInventories() {
  const {
    data: inventories,
    error,
    mutate,
    isLoading,
  } = useSWR('/inventories/my', getMyInventories, {
    revalidateOnFocus: true,
    dedupingInterval: 5000, // Cache for 5 seconds
    errorRetryCount: 3,
    errorRetryInterval: 2000,
  });

  const create = async (data: { name: string; description: string }) => {
    try {
      const newInventory = await createInventory(data);
      // Optimistic update
      mutate([...(inventories || []), newInventory], false);
      return newInventory;
    } catch (error) {
      // Revalidate on error to sync state
      mutate();
      throw error;
    }
  };

  const update = async (id: number, data: { name?: string; description?: string }) => {
    try {
      const updated = await updateInventory(id, data);
      // Update cache optimistically
      mutate(
        inventories?.map(inv => inv.id === id ? { ...inv, ...updated } : inv),
        false
      );
      return updated;
    } catch (error) {
      mutate();
      throw error;
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteInventory(id);
      // Remove from cache optimistically
      mutate(
        inventories?.filter(inv => inv.id !== id),
        false
      );
    } catch (error) {
      mutate();
      throw error;
    }
  };

  return {
    inventories: inventories || [],
    error,
    isLoading,
    mutate,
    create,
    update,
    remove,
  };
}

export function useInventory(id: number | null) {
  const {
    data: inventory,
    error,
    mutate,
    isLoading,
  } = useSWR(
    id ? `/inventories/${id}` : null,
    () => id ? getInventoryById(id) : null,
    {
      revalidateOnFocus: false,
      dedupingInterval: 10000, // Cache single items longer
    }
  );

  return {
    inventory,
    error,
    isLoading,
    mutate,
  };
}
