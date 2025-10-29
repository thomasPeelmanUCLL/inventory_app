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

export type SoldItemDTO = {
  id: number;
  itemId: number;
  finalSellPrice: number;
  priceVariableName?: string | null;
  isCustomPrice?: boolean;
  payedCash?: boolean;
  quantity: number;
  soldAt?: string;
};

type SoldItemCreate = {
  itemId: number;
  finalSellPrice: number;
  quantity: number;
  priceVariableName?: string; // null not allowed by backend create signature
  isCustomPrice?: boolean;
  payedCash?: boolean;
  soldAt?: string;
};

type SoldItemPatch = {
  finalSellPrice?: number;
  quantity?: number;
  priceVariableName?: string | null; // allow null to clear value on update
  isCustomPrice?: boolean;
  payedCash?: boolean;
  soldAt?: string;
};

function normalizeSold(item: any): SoldItemDTO {
  return {
    id: Number(item.id),
    itemId: Number(item.itemId),
    finalSellPrice: typeof item.finalSellPrice === 'string' ? parseFloat(item.finalSellPrice) : Number(item.finalSellPrice),
    priceVariableName: item.priceVariableName ?? null,
    isCustomPrice: !!item.isCustomPrice,
    payedCash: !!item.payedCash,
    quantity: Number(item.quantity),
    soldAt: item.soldAt,
  };
}

export type InventoryAnalyticsDTO = any;

export function useSoldItems() {
  const { data, error, mutate, isLoading } = useSWR<SoldItemDTO[]>(['/soldItems'] as const, async () => {
    const res = await getAllSoldItems();
    return res.map(normalizeSold);
  }, { revalidateOnFocus: true, dedupingInterval: 3000, errorRetryCount: 3 });

  const create = async (payload: SoldItemCreate) => {
    // If UI passes null to clear, coerce to undefined for create
    const prepared = { ...payload } as any;
    if (prepared.priceVariableName === null) prepared.priceVariableName = undefined;
    const created = normalizeSold(await createSoldItem(prepared));
    const withDate: SoldItemDTO = { ...created, soldAt: created.soldAt || new Date().toISOString() };
    await mutate([withDate, ...(data || [])], { revalidate: false });
    return created;
  };

  const update = async (id: number, patch: SoldItemPatch) => {
    const updated = normalizeSold(await updateSoldItem(id, patch as any));
    await mutate((data || []).map((it) => (it.id === id ? { ...it, ...updated } : it)), { revalidate: false });
    return updated;
  };

  const remove = async (id: number) => {
    await deleteSoldItem(id);
    await mutate((data || []).filter((it) => it.id !== id), { revalidate: false });
  };

  return { soldItems: data || [], error, isLoading, mutate, create, update, remove };
}

export function useInventorySoldItems(inventoryId: number | null) {
  const key = inventoryId ? (['/soldItems/inventory', inventoryId] as const) : null;
  const swr = key ? useSWR<SoldItemDTO[]>(key, async () => (await getSoldItemsByInventoryId(inventoryId!)).map(normalizeSold), { revalidateOnFocus: true, dedupingInterval: 3000 }) : ({} as any);

  const data: SoldItemDTO[] | undefined = key ? swr.data : undefined;
  const error = key ? swr.error : undefined;
  const mutate: any = key ? swr.mutate : async () => undefined;
  const isLoading: boolean = key ? swr.isLoading : false;

  const create = async (payload: SoldItemCreate) => {
    const prepared = { ...payload } as any;
    if (prepared.priceVariableName === null) prepared.priceVariableName = undefined;
    const created = normalizeSold(await createSoldItem(prepared));
    const withDate: SoldItemDTO = { ...created, soldAt: created.soldAt || new Date().toISOString() };
    await mutate([withDate, ...((data || []) as SoldItemDTO[])], { revalidate: false });
    return created;
  };

  const update = async (id: number, patch: SoldItemPatch) => {
    const updated = normalizeSold(await updateSoldItem(id, patch as any));
    await mutate((data || []).map((it: SoldItemDTO) => (it.id === id ? { ...it, ...updated } : it)), { revalidate: false });
    return updated;
  };

  const remove = async (id: number) => {
    await deleteSoldItem(id);
    await mutate((data || []).filter((it: SoldItemDTO) => it.id !== id), { revalidate: false });
  };

  return { soldItems: data || [], error, isLoading, mutate, create, update, remove };
}

export function useItemSoldItems(itemId: number | null) {
  const key = itemId ? (['/soldItems/item', itemId] as const) : null;
  const swr = key ? useSWR<SoldItemDTO[]>(key, async () => (await getSoldItemsByItemId(itemId!)).map(normalizeSold), { revalidateOnFocus: false, dedupingInterval: 5000 }) : ({} as any);
  return { soldItems: (key ? swr.data : undefined) || [], error: key ? swr.error : undefined, isLoading: key ? swr.isLoading : false, mutate: key ? swr.mutate : async () => undefined };
}

export function useSoldItem(soldItemId: number | null) {
  const key = soldItemId ? (['/soldItems', soldItemId] as const) : null;
  const swr = key ? useSWR<SoldItemDTO | null>(key, async () => normalizeSold(await getSoldItemById(soldItemId!)), { revalidateOnFocus: false, dedupingInterval: 10000 }) : ({} as any);
  return { soldItem: key ? swr.data : undefined, error: key ? swr.error : undefined, isLoading: key ? swr.isLoading : false, mutate: key ? swr.mutate : async () => undefined };
}

export function useInventoryAnalytics(inventoryId: number | null, startDate?: Date, endDate?: Date) {
  const key = inventoryId ? (['/soldItems/analytics', inventoryId, startDate?.toISOString().slice(0,10) ?? 'no-start', endDate?.toISOString().slice(0,10) ?? 'no-end'] as const) : null;
  const swr = key ? useSWR<InventoryAnalyticsDTO>(key, () => getInventoryAnalytics(inventoryId!, startDate, endDate), { revalidateOnFocus: false, dedupingInterval: 30000, errorRetryCount: 2 }) : ({} as any);
  const refresh = async () => { if (key) await swr.mutate(); };
  return { analytics: key ? swr.data : undefined, error: key ? swr.error : undefined, isLoading: key ? swr.isLoading : false, refresh };
}
