import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, updateItem, deleteItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';

type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    createdAt: string;
};

type Inventory = {
    id: number;
    name: string;
    description: string;
    items: Item[];
    users?: Array<{
        role: string;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
};

const ManageItemsPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    useEffect(() => {
        if (id) {
            fetchInventory();
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

    const handleSave = async (item: Item) => {
        try {
            await updateItem(item.id, {
                name: item.name,
                description: item.description,
                price: item.price,
                quantity: item.quantity
            });
            setEditingItem(null);
            fetchInventory();
            alert('Item updated successfully!');
        } catch (error) {
            console.error('Error updating item:', error);
            alert('Failed to update item');
        }
    };


    const handleDelete = async (itemId: number) => {
        if (confirm('Are you sure you want to delete this item?')) {
            try {
                await deleteItem(itemId);
                fetchInventory();
                alert('Item deleted successfully!');
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Failed to delete item');
            }
        }
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-xl">Loading...</div>
                </div>
            </>
        );
    }

    if (!inventory) {
        return (
            <>
                <Header />
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-xl">Inventory not found</div>
                </div>
            </>
        );
    }

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';

    return (
        <>
            <Header />
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Link href="/Inventory" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
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

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {inventory.items && inventory.items.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Description
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Quantity
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {inventory.items.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingItem.name}
                                                        onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="text"
                                                        value={editingItem.description}
                                                        onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                                                        className="w-full px-2 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-gray-500">{item.description}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={editingItem.price}
                                                        onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                                                        className="w-24 px-2 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-gray-900">${item.price.toFixed(2)}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {editingItem?.id === item.id ? (
                                                    <input
                                                        type="number"
                                                        value={editingItem.quantity}
                                                        onChange={(e) => setEditingItem({ ...editingItem, quantity: Number(e.target.value) })}
                                                        className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                    />
                                                ) : (
                                                    <div className="text-sm text-gray-900">{item.quantity}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {editingItem?.id === item.id ? (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleSave(editingItem)}
                                                            className="text-green-600 hover:text-green-900"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingItem(null)}
                                                            className="text-gray-600 hover:text-gray-900"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => setEditingItem(item)}
                                                            className="text-blue-600 hover:text-blue-900"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
                                                            className="text-red-600 hover:text-red-900"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 mb-4">No items in this inventory.</p>
                                <Link href={`/Inventory/${id}/add`}>
                                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Add items to get started
                                    </button>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {showManageUsers && inventory && (
                    <ManageUsersModal
                        inventoryId={inventory.id}
                        isOwner={isOwner}
                        onClose={() => {
                            setShowManageUsers(false);
                            fetchInventory();
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default ManageItemsPage;
