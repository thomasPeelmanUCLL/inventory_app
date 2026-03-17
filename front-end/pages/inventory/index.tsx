import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/layout/Header';
import InventoryCard from '../../components/inventory/InventoryCard';
import CreateInventoryModal from '../../components/inventory/CreateInventoryModal';
import { getMyInventories, createInventory, deleteInventory } from '../../lib/api';
import { useSession } from '../../lib/auth-client';
import { Inventory } from '@types';

export default function InventoryListPage() {
    const router = useRouter();
    const { data: session, isPending } = useSession();
    const [fetchedInventories, setFetchedInventories] = useState<Inventory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (!isPending && !session) { router.push('/login'); return; }
        if (session) void loadInventories();
    }, [session, isPending]);

    const loadInventories = async () => {
        try {
            setIsLoading(true);
            setFetchError(null);
            const inventoryList = await getMyInventories();
            setFetchedInventories(inventoryList);
        } catch (err: any) {
            setFetchError(err.message || 'Failed to load inventories');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateInventory = async (newInventoryData: { name: string; description: string }) => {
        await createInventory(newInventoryData);
        setShowCreateModal(false);
        await loadInventories();
    };

    const handleDeleteInventory = async (inventoryId: number) => {
        try {
            await deleteInventory(inventoryId);
            await loadInventories();
        } catch (fetchError: any) {
            alert(fetchError.message || 'Failed to delete inventory');
        }
    };

    if (isPending || isLoading) return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">Loading...</div>
            </div>
        </>
    );

    if (fetchError) return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="text-red-600">{fetchError}</div>
            </div>
        </>
    );

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Inventories</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        + New Inventory
                    </button>
                </div>

                {fetchedInventories.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-gray-500 text-lg mb-4">No inventories yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Create your first inventory
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fetchedInventories.map((inventory) => (
                            <InventoryCard
                                key={inventory.id}
                                inventory={inventory}
                                currentUserId={session?.user?.id}
                                onDelete={handleDeleteInventory}
                            />
                        ))}
                    </div>
                )}
            </div>

            {showCreateModal && (
                <CreateInventoryModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreateInventory}
                />
            )}
        </>
    );
}
