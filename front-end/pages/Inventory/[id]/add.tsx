import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, createItem } from '../../../lib/api';
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
        price: '',
        quantity: '',
        buyedAt: ''
    });

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createItem({
                inventoryId: Number(id),
                name: formData.name,
                description: formData.description,
                price: parseFloat(formData.price),
                quantity: parseInt(formData.quantity),
                buyedAt: formData.buyedAt ? new Date(formData.buyedAt) : undefined
            });

            setFormData({
                name: '',
                description: '',
                price: '',
                quantity: '',
                buyedAt: ''
            });

            fetchInventory();
            alert('Item added successfully!');
        } catch (error) {
            console.error('Error adding item:', error);
            alert('Failed to add item');
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
                        activeTab="add"
                        onManageUsers={() => setShowManageUsers(true)}
                    />

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Create New Item</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter item name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="Enter item description"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Price *
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            required
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purchase Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.buyedAt}
                                    onChange={(e) => setFormData({ ...formData, buyedAt: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                            >
                                Add Item
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">
                            Current Items ({inventory.items?.length || 0})
                        </h2>

                        {inventory.items && inventory.items.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {inventory.items.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
                                        <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</span>
                                            <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                <p>No items yet. Add some items to get started!</p>
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

export default AddItemPage;
