import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, createItem, getPriceVariablesByInventoryId, createPriceVariable } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, PriceVariable } from '@types';

const AddItemPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [showCreateVariable, setShowCreateVariable] = useState(false);
    const [newVariableName, setNewVariableName] = useState('');
    const [newVariableValue, setNewVariableValue] = useState('');      // ← CHANGE from newVariableFormula
    const [newVariableType, setNewVariableType] = useState('PERCENTAGE'); // ← ADD THIS
    const [newVariableIsDefault, setNewVariableIsDefault] = useState(false); // ← ADD THIS

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        buyPrice: '',
        quantity: '',
        buyedAt: '',
        priceVariableId: null as number | null,
    });

    useEffect(() => {
        if (id) {
            void fetchInventory();
            void fetchPriceVariables();
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

    const fetchPriceVariables = async () => {
        try {
            const variables = await getPriceVariablesByInventoryId(Number(id));
            setPriceVariables(variables);
        } catch (error) {
            console.error('Error fetching price variables:', error);
        }
    };

    const handleCreateVariable = async () => {
        if (!newVariableName.trim() || !newVariableValue) {
            alert('Please fill in both name and value');
            return;
        }

        try {
            // Log to see what you're sending
            console.log('Sending:', {
                name: newVariableName,
                value: Number(newVariableValue),
                type: newVariableType,
                isDefault: newVariableIsDefault,
                inventoryId: Number(id),
            });

            await createPriceVariable(Number(id), {
                name: newVariableName,
                value: Number(newVariableValue),
                type: newVariableType,
                isDefault: newVariableIsDefault,
                inventoryId: Number(id),
            });

            await fetchPriceVariables();
            setShowCreateVariable(false);
            setNewVariableName('');
            setNewVariableValue('');
            setNewVariableType('PERCENTAGE');
            setNewVariableIsDefault(false);
            alert('Price variable created successfully!');
        } catch (error) {
            console.error('Error creating price variable:', error);
            alert('Failed to create price variable. Check console for details.');
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
                buyedAt: formData.buyedAt || new Date().toISOString(),
                priceVariableId: formData.priceVariableId,
            };

            await createItem(Number(id), itemData);
            alert('Item added successfully!');

            // Reset form
            setFormData({
                name: '',
                description: '',
                buyPrice: '',
                quantity: '',
                buyedAt: '',
                priceVariableId: null,
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

    if (!canEdit) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">
                    <p className="text-red-600">You don't have permission to add items to this inventory.</p>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
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

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Create New Item Form */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold mb-6">Create New Item</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Item Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Enter item name"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="Enter item description"
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Buy Price *
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.buyPrice}
                                        onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                    placeholder="0"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Default Price Variable (Optional)
                                </label>
                                <select
                                    value={formData.priceVariableId || ''}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === 'CREATE_NEW') {
                                            setShowCreateVariable(true);
                                        } else {
                                            setFormData({ ...formData, priceVariableId: value ? Number(value) : null });
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                >
                                    <option value="">None</option>
                                    {priceVariables.map((variable) => (
                                        <option key={variable.id} value={variable.id}>
                                            {variable.name} ({variable.type === 'PERCENTAGE' ? `${variable.value}%` : `€${variable.value}`})
                                        </option>
                                    ))}

                                    <option value="CREATE_NEW" className="text-blue-600 font-semibold">
                                        + Create New Variable
                                    </option>
                                </select>
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Purchase Date (Optional)
                                </label>
                                <input
                                    type="date"
                                    value={formData.buyedAt}
                                    onChange={(e) => setFormData({ ...formData, buyedAt: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Add Item
                            </button>
                        </form>
                    </div>

                    {/* Current Items List */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-2xl font-semibold mb-6">Current Items ({inventory.items?.length || 0})</h2>
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                            {inventory.items && inventory.items.length > 0 ? (
                                inventory.items.map((item) => (
                                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                                        <h3 className="font-semibold text-lg">{item.name}</h3>
                                        <p className="text-sm text-gray-600">{item.description}</p>
                                        <div className="mt-2 flex justify-between">
                                            <span className="text-green-600 font-semibold">
                                                ${Number(item.buyPrice ?? 0).toFixed(2)}
                                            </span>
                                            <span className="text-gray-500">Qty: {item.quantity ?? 0}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-center py-8">No items yet</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showManageUsers && (
                <ManageUsersModal
                    inventoryId={inventory.id}
                    isOwner={isOwner}
                    onClose={() => {
                        setShowManageUsers(false);
                        void fetchInventory();
                    }}
                />
            )}

            {showCreateVariable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Create New Price Variable</h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Variable Name
                            </label>
                            <input
                                type="text"
                                value={newVariableName}
                                onChange={(e) => setNewVariableName(e.target.value)}
                                placeholder="e.g., Member Discount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Type
                            </label>
                            <select
                                value={newVariableType}
                                onChange={(e) => setNewVariableType(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED">Fixed Amount</option>
                            </select>
                        </div>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Value {newVariableType === 'PERCENTAGE' ? '(%)' : '(€)'}
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={newVariableValue}
                                onChange={(e) => setNewVariableValue(e.target.value)}
                                placeholder={newVariableType === 'PERCENTAGE' ? '10' : '5.00'}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                {newVariableType === 'PERCENTAGE'
                                    ? 'Enter percentage (e.g., 10 for 10% markup)'
                                    : 'Enter fixed amount (e.g., 5.00 for €5 markup)'}
                            </p>
                        </div>

                        <div className="mb-4">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={newVariableIsDefault}
                                    onChange={(e) => setNewVariableIsDefault(e.target.checked)}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">Set as default for new items</span>
                            </label>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setShowCreateVariable(false);
                                    setNewVariableName('');
                                    setNewVariableValue('');
                                    setNewVariableType('PERCENTAGE');
                                    setNewVariableIsDefault(false);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateVariable}
                                className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700"
                            >
                                Create Variable
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </>
    );
};

export default AddItemPage;
