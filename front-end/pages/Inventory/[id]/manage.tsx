import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, updateItem, deleteItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory } from '@types';

const ManagePage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    useEffect(() => {
        if (id) {
            void fetchInventory(); // Added 'void' to handle promise warning
        }
    }, [id]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await getInventoryById(Number(id));
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    const handleSaveItem = async (item: Item) => {
        if (!item.id) {
            alert('Cannot update item without ID');
            return;
        }

        try {
            await updateItem(item.id, {
                name: item.name,
                description: item.description,
                buyPrice: item.buyPrice,
                quantity: item.quantity
            });

            setEditingItem(null);
            await fetchInventory();
            alert('Item updated successfully!');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item');
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm('Are you sure you want to delete this item?')) return;

        try {
            await deleteItem(itemId);
            await fetchInventory();
            alert('Item deleted successfully!');
        } catch (error) {
            console.error('Error deleting item:', error);
            alert('Failed to delete item');
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">Loading...</div>
            </>
        );
    }

    if (!inventory) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">Inventory not found</div>
            </>
        );
    }

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Link href="/Inventory" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="manage"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Buy Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                {canEdit && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {inventory.items && inventory.items.length > 0 ? (
                                inventory.items.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            {editingItem?.id === item.id && editingItem ? (
                                                <input
                                                    type="text"
                                                    value={editingItem.name}
                                                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <span className="font-medium">{item.name}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingItem?.id === item.id && editingItem ? (
                                                <input
                                                    type="text"
                                                    value={editingItem.description}
                                                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <span className="text-gray-600">{item.description}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingItem?.id === item.id && editingItem ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editingItem.buyPrice}
                                                    onChange={(e) => setEditingItem({ ...editingItem, buyPrice: Number(e.target.value) })}
                                                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <span className="text-green-600 font-semibold">${Number(item.buyPrice).toFixed(2)}</span>

                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingItem?.id === item.id && editingItem ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={editingItem.quantity}
                                                    onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                />
                                            ) : (
                                                <span>{item.quantity}</span>
                                            )}
                                        </td>
                                        {canEdit && (
                                            <td className="px-6 py-4">
                                                {editingItem?.id === item.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => editingItem && handleSaveItem(editingItem)}
                                                            className="text-green-600 hover:text-green-800"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingItem(null)}
                                                            className="text-gray-600 hover:text-gray-800"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingItem(item)}
                                                            className="text-blue-600 hover:text-blue-800"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => item.id && handleDeleteItem(item.id)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={canEdit ? 5 : 4} className="px-6 py-12 text-center text-gray-500">
                                        No items in this inventory.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showManageUsers && (
                <ManageUsersModal
                    inventoryId={inventory.id}
                    isOwner={isOwner}
                    onClose={() => {
                        setShowManageUsers(false);
                        void fetchInventory(); // Added 'void'
                    }}
                />
            )}
        </>
    );
};

export default ManagePage;
