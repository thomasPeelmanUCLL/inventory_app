import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getInventoryById } from '../lib/api';
import { useSession } from '../lib/auth-client';
import { Inventory, InventoryRole } from '@types';

/**
 * Everything the /inventory/[id]/* pages share: the inventory from the URL, its loading state
 * and the current user's role in it. `reload` refreshes in place, without the loading screen.
 */
export function useInventoryPage() {
    const router = useRouter();
    const inventoryId = router.isReady ? Number(router.query.id) : null;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const reload = useCallback(async () => {
        if (!inventoryId) return;
        try {
            setError(null);
            setInventory(await getInventoryById(inventoryId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    }, [inventoryId]);

    useEffect(() => {
        void reload();
    }, [reload]);

    const role: InventoryRole =
        inventory?.users?.find((member) => member.user.id === session?.user.id)?.role ?? 'viewer';

    return {
        inventoryId,
        inventory,
        isLoading,
        error,
        reload,
        role,
        canEdit: role === 'owner' || role === 'editor',
        isOwner: role === 'owner',
    };
}

export type InventoryPage = ReturnType<typeof useInventoryPage>;
