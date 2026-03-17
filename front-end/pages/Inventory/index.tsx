import { useEffect, useState } from 'react';
import Header from '@components/layout/header';
import InventoryCard from '@components/inventory/InventoryCard';
import CreateInventoryModal from '@components/inventory/CreateInventoryModal';
import { getMyInventories, createInventory, deleteInventory } from '../../lib/api';
import { useSession } from '../../lib/auth-client';
import { Inventory } from '@types';

const InventoriesPage = () => {
    const { data: session } = useSession();
    const [inventories, setInventories] = useState<Inventory[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        if (session) fetchInventories();
    }, [session]);

    const fetchInventories = async () => {
        try {
            const data = await getMyInventories();
            setInventories(data);
        } catch (error) {
            console.error('Error fetching inventories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (form: { name: string; description: string }) => {
        try {
            await createInventory(form);
            setShowCreateModal(false);
            await fetchInventories();
        } catch {
            alert('Failed to create inventory');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this inventory?')) return;
        try {
            await deleteInventory(id);
            await fetchInventories();
        } catch {
            alert('Failed to delete inventory. Only owners can delete.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">My Inventories</h1>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        + New Inventory
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-lg text-gray-600">Loading...</div>
                    </div>
                ) : inventories.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-12 text-center">
                        <p className="text-gray-500 text-lg mb-4">No inventories yet</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Create Your First Inventory
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inventories.map((inv) => (
                            <InventoryCard
                                key={inv.id}
                                inventory={inv}
                                currentUserId={session?.user.id}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                )}
            </main>

            {showCreateModal && (
                <CreateInventoryModal
                    onClose={() => setShowCreateModal(false)}
                    onCreate={handleCreate}
                />
            )}
        </div>
    );
};

export default InventoriesPage;
