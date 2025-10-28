import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import {
    getInventoryById,
    updateItem,
    deleteItem,
    getPriceVariablesByItemId,
    createPriceVariable,
    updatePriceVariable,
    deletePriceVariable
} from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, PriceVariable } from '@types';

const ManageItemsPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);

    // Price variable states
    const [expandedItemId, setExpandedItemId] = useState<number | null>(null);
    const [itemPriceVariables, setItemPriceVariables] = useState<Record<number, PriceVariable[]>>({});
    const [showAddPriceVariable, setShowAddPriceVariable] = useState<number | null>(null);
    const [editingPriceVariable, setEditingPriceVariable] = useState<PriceVariable | null>(null);
    const [newPriceVariable, setNewPriceVariable] = useState({
        name: '',
        value: '',
        type: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
        isDefault: false,
    });

    useEffect(() => {
        if (id) {
            void fetchInventory();
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

    const fetchPriceVariablesForItem = async (itemId: number) => {
        try {
            const variables = await getPriceVariablesByItemId(itemId);
            setItemPriceVariables(prev => ({ ...prev, [itemId]: variables }));
        } catch (error) {
            console.error('Error fetching price variables:', error);
            setItemPriceVariables(prev => ({ ...prev, [itemId]: [] }));
        }
    };

    const toggleItemExpansion = async (itemId: number) => {
        if (expandedItemId === itemId) {
            setExpandedItemId(null);
        } else {
            setExpandedItemId(itemId);
            if (!itemPriceVariables[itemId]) {
                await fetchPriceVariablesForItem(itemId);
            }
        }
    };

    const handleEditItem = (item: Item) => {
        setEditingItem({ ...item });
    };

    const handleSaveItem = async () => {
        if (!editingItem || !editingItem.id) return;

        try {
            await updateItem(editingItem.id, {
                name: editingItem.name || '',
                description: editingItem.description || '',
                buyPrice: editingItem.buyPrice ?? 0,
                quantity: editingItem.quantity ?? 0,
            });

            await fetchInventory();
            setEditingItem(null);
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

    const handleCreatePriceVariable = async (itemId: number) => {
        if (!newPriceVariable.name || !newPriceVariable.value) {
            alert('Please fill in all fields');
            return;
        }

        try {
            await createPriceVariable(itemId, {
                name: newPriceVariable.name,
                value: parseFloat(newPriceVariable.value),
                type: newPriceVariable.type,
                isDefault: newPriceVariable.isDefault,
            });

            setNewPriceVariable({
                name: '',
                value: '',
                type: 'PERCENTAGE',
                isDefault: false,
            });
            setShowAddPriceVariable(null);
            await fetchPriceVariablesForItem(itemId);
            alert('Price variable created successfully!');
        } catch (error) {
            console.error('Error creating price variable:', error);
            alert('Failed to create price variable');
        }
    };

    const handleUpdatePriceVariable = async () => {
        if (!editingPriceVariable || !editingPriceVariable.id) return;

        try {
            await updatePriceVariable(editingPriceVariable.id, {
                name: editingPriceVariable.name,
                value: editingPriceVariable.value,
                type: editingPriceVariable.type,
                isDefault: editingPriceVariable.isDefault,
            });

            setEditingPriceVariable(null);
            await fetchPriceVariablesForItem(editingPriceVariable.itemId);
            alert('Price variable updated successfully!');
        } catch (error) {
            console.error('Error updating price variable:', error);
            alert('Failed to update price variable');
        }
    };

    const handleDeletePriceVariable = async (priceVariableId: number, itemId: number) => {
        if (!confirm('Are you sure you want to delete this price variable?')) return;

        try {
            await deletePriceVariable(priceVariableId);
            await fetchPriceVariablesForItem(itemId);
            alert('Price variable deleted successfully!');
        } catch (error) {
            console.error('Error deleting price variable:', error);
            alert('Failed to delete price variable');
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center">Loading...</div>
                </div>
            </>
        );
    }

    if (!inventory) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-600">Inventory not found</div>
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
            <div className="container mx-auto px-4 py-8">
                <Link
                    href="/inventory"
                    className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                >
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

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Manage Items ({inventory.items?.length || 0})
                    </h2>

                    {inventory.items && inventory.items.length > 0 ? (
                        <div className="space-y-4">
                            {inventory.items.map((item) => (
                                <div key={item.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                    {/* Item Header */}
                                    <div className="bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 grid grid-cols-4 gap-4">
                                                {/* Name */}
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Name</div>
                                                    {editingItem?.id === item.id && editingItem ? (
                                                        <input
                                                            type="text"
                                                            value={editingItem.name ?? ''}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                name: e.target.value,
                                                                description: editingItem.description ?? '',
                                                                buyPrice: editingItem.buyPrice ?? 0,
                                                                quantity: editingItem.quantity ?? 0
                                                            })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="font-medium">{item.name}</div>
                                                    )}
                                                </div>

                                                {/* Description */}
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Description</div>
                                                    {editingItem?.id === item.id && editingItem ? (
                                                        <input
                                                            type="text"
                                                            value={editingItem.description ?? ''}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                name: editingItem.name ?? '',
                                                                description: e.target.value,
                                                                buyPrice: editingItem.buyPrice ?? 0,
                                                                quantity: editingItem.quantity ?? 0
                                                            })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-sm">{item.description}</div>
                                                    )}
                                                </div>

                                                {/* Buy Price */}
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Buy Price</div>
                                                    {editingItem?.id === item.id && editingItem ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={editingItem.buyPrice ?? 0}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                name: editingItem.name ?? '',
                                                                description: editingItem.description ?? '',
                                                                buyPrice: parseFloat(e.target.value),
                                                                quantity: editingItem.quantity ?? 0
                                                            })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-green-600 font-medium">
                                                            ${Number(item.buyPrice || 0).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Quantity */}
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">Quantity</div>
                                                    {editingItem?.id === item.id && editingItem ? (
                                                        <input
                                                            type="number"
                                                            value={editingItem.quantity ?? 0}
                                                            onChange={(e) => setEditingItem({
                                                                ...editingItem,
                                                                name: editingItem.name ?? '',
                                                                description: editingItem.description ?? '',
                                                                buyPrice: editingItem.buyPrice ?? 0,
                                                                quantity: parseInt(e.target.value)
                                                            })}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div>{item.quantity}</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            {canEdit && (
                                                <div className="ml-4 flex gap-2">
                                                    {editingItem?.id === item.id ? (
                                                        <>
                                                            <button
                                                                onClick={handleSaveItem}
                                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingItem(null)}
                                                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleEditItem(item)}
                                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => item.id && toggleItemExpansion(item.id)}
                                                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                            >
                                                                {expandedItemId === item.id ? '▼' : '▶'} Prices
                                                            </button>
                                                            <button
                                                                onClick={() => item.id && handleDeleteItem(item.id)}
                                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Price Variables Section (Expandable) */}
                                    {expandedItemId === item.id && item.id && (
                                        <div className="p-4 bg-white border-t border-gray-200">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-lg font-semibold">Price Variables</h3>
                                                {canEdit && (
                                                    <button
                                                        onClick={() => setShowAddPriceVariable(item.id!)}
                                                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                    >
                                                        + Add Price Variable
                                                    </button>
                                                )}
                                            </div>

                                            {/* Add Price Variable Form */}
                                            {showAddPriceVariable === item.id && (
                                                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <h4 className="font-medium mb-3">New Price Variable</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            type="text"
                                                            placeholder="Name (e.g., Regular Markup)"
                                                            value={newPriceVariable.name}
                                                            onChange={(e) => setNewPriceVariable({ ...newPriceVariable, name: e.target.value })}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Value"
                                                            value={newPriceVariable.value}
                                                            onChange={(e) => setNewPriceVariable({ ...newPriceVariable, value: e.target.value })}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        />
                                                        <select
                                                            value={newPriceVariable.type}
                                                            onChange={(e) => setNewPriceVariable({ ...newPriceVariable, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                                            className="px-3 py-2 border border-gray-300 rounded"
                                                        >
                                                            <option value="PERCENTAGE">Percentage (%)</option>
                                                            <option value="FIXED">Fixed Amount ($)</option>
                                                        </select>
                                                        <label className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={newPriceVariable.isDefault}
                                                                onChange={(e) => setNewPriceVariable({ ...newPriceVariable, isDefault: e.target.checked })}
                                                                className="w-4 h-4"
                                                            />
                                                            <span>Set as Default</span>
                                                        </label>
                                                    </div>
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => handleCreatePriceVariable(item.id!)}
                                                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                                                        >
                                                            Create
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setShowAddPriceVariable(null);
                                                                setNewPriceVariable({ name: '', value: '', type: 'PERCENTAGE', isDefault: false });
                                                            }}
                                                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Price Variables List */}
                                            <div className="space-y-2">
                                                {itemPriceVariables[item.id] && itemPriceVariables[item.id].length > 0 ? (
                                                    itemPriceVariables[item.id].map((pv) => (
                                                        <div key={pv.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                            {editingPriceVariable?.id === pv.id ? (
                                                                <div className="grid grid-cols-4 gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={editingPriceVariable.name}
                                                                        onChange={(e) => setEditingPriceVariable({ ...editingPriceVariable, name: e.target.value })}
                                                                        className="px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                    <input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={editingPriceVariable.value}
                                                                        onChange={(e) => setEditingPriceVariable({ ...editingPriceVariable, value: parseFloat(e.target.value) })}
                                                                        className="px-2 py-1 border border-gray-300 rounded"
                                                                    />
                                                                    <select
                                                                        value={editingPriceVariable.type}
                                                                        onChange={(e) => setEditingPriceVariable({ ...editingPriceVariable, type: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                                                                        className="px-2 py-1 border border-gray-300 rounded"
                                                                    >
                                                                        <option value="PERCENTAGE">%</option>
                                                                        <option value="FIXED">$</option>
                                                                    </select>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={handleUpdatePriceVariable}
                                                                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setEditingPriceVariable(null)}
                                                                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex justify-between items-center">
                                                                    <div className="flex gap-4">
                                                                        <span className="font-medium">{pv.name}</span>
                                                                        <span className="text-blue-600">
                                      {pv.type === 'PERCENTAGE' ? `${pv.value}%` : `$${pv.value.toFixed(2)}`}
                                    </span>
                                                                        {pv.isDefault && (
                                                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                                        Default
                                      </span>
                                                                        )}
                                                                    </div>
                                                                    {canEdit && (
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => setEditingPriceVariable({ ...pv })}
                                                                                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                                                                            >
                                                                                Edit
                                                                            </button>
                                                                            <button
                                                                                onClick={() => pv.id && handleDeletePriceVariable(pv.id, item.id!)}
                                                                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                                                            >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center text-gray-500 py-4">
                                                        No price variables yet. Add one to get started!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            No items in this inventory.
                        </div>
                    )}
                </div>

                {showManageUsers && (
                    <ManageUsersModal
                        inventoryId={Number(id)}
                        isOwner={isOwner}
                        onClose={() => {
                            setShowManageUsers(false);
                            void fetchInventory();
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default ManageItemsPage;
