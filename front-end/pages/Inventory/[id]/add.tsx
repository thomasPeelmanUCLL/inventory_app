import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '@components/layout/header';
import InventoryHeader from '@components/inventory/InventoryHeader';
import ManageUsersModal from '@components/inventory/ManageUsersModal';
import {
    getInventoryById,
    createItem,
    getItemsByInventoryId
} from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, PriceVariable } from '@types';

const AddItemPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        buyPrice: '',
        quantity: '',
        buyedAt: '',
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

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.description || !formData.buyPrice || !formData.quantity) {
            alert('Please fill in all required fields');
            return;
        }

        try {
            const itemData = {
                name: formData.name,
                description: formData.description,
                buyPrice: parseFloat(formData.buyPrice),
                quantity: parseInt(formData.quantity),
                buyedAt: formData.buyedAt || undefined,
                inventoryId: Number(id),
            };

            await createItem(itemData);
            alert('Item added successfully!');

            // Reset form
            setFormData({
                name: '',
                description: '',
                buyPrice: '',
                quantity: '',
                buyedAt: '',
            });

            // Refresh inventory
            await fetchInventory();
        } catch (error) {
            console.error('Error creating item:', error);
            alert('Failed to add item');
        }
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

    if (!canEdit) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <div className="text-center text-red-600">
                        You don't have permission to add items to this inventory.
                    </div>
                </div>
            </>
        );
    }

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
                    activeTab="add"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                {/* Create New Item Form */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Item</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Item Name *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter item name"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Description *
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Enter item description"
                                rows={3}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buy Price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">€</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.buyPrice}
                                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Purchase Date (Optional)
                            </label>
                            <input
                                type="date"
                                value={formData.buyedAt}
                                onChange={(e) => setFormData({ ...formData, buyedAt: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-sm text-blue-800">
                                <strong>Note:</strong> Price variables can be added after creating the item.
                                Go to the "Manage" tab to configure price variables for existing items.
                            </p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
                        >
                            Add Item
                        </button>
                    </form>
                </div>

                {/* Current Items List */}
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                        Current Items ({inventory.items?.length || 0})
                    </h2>
                    <div className="space-y-4">
                        {inventory.items && inventory.items.length > 0 ? (
                            inventory.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 rounded-md p-4 hover:border-blue-400 transition-colors"
                                >
                                    <h3 className="font-semibold text-lg text-gray-900">{item.name}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                                    <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-green-600 font-medium">
                      ${Number(item.buyPrice ?? 0).toFixed(2)}
                    </span>
                                        <span className="text-gray-600">
                      Qty: {item.quantity ?? 0}
                    </span>
                                        {item.priceVariables && item.priceVariables.length > 0 && (
                                            <span className="text-blue-600">
                        {item.priceVariables.length} price variable(s)
                      </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">
                                No items yet. Add your first item above!
                            </div>
                        )}
                    </div>
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

export default AddItemPage;
