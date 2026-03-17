import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import PriceVariablesSection from '../../../components/inventory/PriceVariablesSection';
import { getInventoryById, updateItem, deleteItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory } from '@types';

const ManageItemsPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);

    useEffect(() => {
        if (id) void fetchInventory();
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

    const handleSaveItem = async () => {
        if (!editingItem?.id) return;
        try {
            await updateItem(editingItem.id, {
                name: editingItem.name || '',
                description: editingItem.description || '',
                buyPrice: editingItem.buyPrice ?? 0,
                quantity: editingItem.quantity ?? 0,
            });
            await fetchInventory();
            setEditingItem(null);
        } catch { alert('Failed to update item'); }
    };

    const handleDeleteItem = async (itemId: number) => {
        if (!confirm('Delete this item?')) return;
        try {
            await deleteItem(itemId);
            await fetchInventory();
        } catch { alert('Failed to delete item'); }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    if (loading) return (<><Header /><div className="container mx-auto px-4 py-8"><div className="text-center">Loading...</div></div></>);
    if (!inventory) return (<><Header /><div className="container mx-auto px-4 py-8"><div className="text-center text-red-600">Inventory not found</div></div></>);

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">← Back to Inventories</Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="manage"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Manage Items ({inventory.items?.length || 0})
                    </h2>

                    {inventory.items && inventory.items.length > 0 ? (
                        <div className="space-y-4">
                            {inventory.items.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Item header row */}
                                    <div className="bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 grid grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Name</div>
                                                    {editingItem?.id === item.id ? (
                                                        <input type="text" value={editingItem.name ?? ''} onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" />
                                                    ) : <div className="font-medium">{item.name}</div>}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Description</div>
                                                    {editingItem?.id === item.id ? (
                                                        <input type="text" value={editingItem.description ?? ''} onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })} className="w-full px-2 py-1 border border-gray-300 rounded" />
                                                    ) : <div className="text-sm">{item.description}</div>}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Buy Price</div>
                                                    {editingItem?.id === item.id ? (
                                                        <input type="number" step="0.01" value={editingItem.buyPrice ?? 0} onChange={(e) => setEditingItem({ ...editingItem, buyPrice: parseFloat(e.target.value) })} className="w-full px-2 py-1 border border-gray-300 rounded" />
                                                    ) : <div className="text-green-600 font-medium">€{Number(item.buyPrice || 0).toFixed(2)}</div>}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Quantity</div>
                                                    {editingItem?.id === item.id ? (
                                                        <input type="number" value={editingItem.quantity ?? 0} onChange={(e) => setEditingItem({ ...editingItem, quantity: parseInt(e.target.value) })} className="w-full px-2 py-1 border border-gray-300 rounded" />
                                                    ) : <div>{item.quantity}</div>}
                                                </div>
                                            </div>

                                            {canEdit && (
                                                <div className="ml-4 flex gap-2">
                                                    {editingItem?.id === item.id ? (
                                                        <>
                                                            <button onClick={handleSaveItem} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Save</button>
                                                            <button onClick={() => setEditingItem(null)} className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600">Cancel</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => setEditingItem({ ...item })} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">Edit</button>
                                                            <button
                                                                onClick={() => setExpandedItemId(expandedItemId === item.id ? null : (item.id ?? null))}
                                                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                            >
                                                                {expandedItemId === item.id ? '▼' : '▶'} Prices
                                                            </button>
                                                            <button onClick={() => item.id && handleDeleteItem(item.id)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price variables — extracted component */}
                                    {expandedItemId === item.id && item.id && (
                                        <PriceVariablesSection itemId={item.id} canEdit={canEdit} />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">No items in this inventory.</div>
                    )}
                </div>

                {showManageUsers && (
                    <ManageUsersModal
                        inventoryId={Number(id)}
                        isOwner={isOwner}
                        onClose={() => { setShowManageUsers(false); void fetchInventory(); }}
                    />
                )}
            </div>
        </>
    );
};

export default ManageItemsPage;
