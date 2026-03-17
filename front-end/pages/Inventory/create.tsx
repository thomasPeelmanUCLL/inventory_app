// This page is intentionally deleted.
// Inventory creation is handled by the CreateInventoryModal on /Inventory.
// This file is kept as a redirect for any stale bookmarks.
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CreateInventoryRedirect() {
    const router = useRouter();
    useEffect(() => { router.replace('/Inventory'); }, []);
    return null;
}
