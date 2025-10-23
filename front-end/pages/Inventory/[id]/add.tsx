import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../../services/InventoryService';
import ItemService from '../../../services/ItemService';
import Link from 'next/link';
import {Inventory, Item, NewItemForm} from "@types";



export default function AddItemsToInventory() {
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [availableItems, setAvailableItems] = useState<Item[]>([]);
    const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
    const [showNewItemForm, setShowNewItemForm] = useState(false);
    const [newItem, setNewItem] = useState<NewItemForm>({
        name: '',
        description: '',
        price: 0,
        quantity: 1
    });
    const [addingItem, setAddingItem] = useState(false);

    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            fetchInventory(Number(id));
            fetchAvailableItems();
        }
    }, [id]);

    const fetchInventory = async (inventoryId: number) => {
        try {
            setLoading(true);
            const data = await InventoryService.getInventoryById(inventoryId);
            setInventory(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to load inventory: ${err.message}`);
            } else {
                setError('Failed to load inventory');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableItems = async () => {
        try {
            const items = await ItemService.getAllItems();
            if (!('error' in items)) {
                setAvailableItems(items);
            }
        } catch (err) {
            console.error('Error fetching available items:', err);
        }
    };

    const handleAddExistingItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedItemId || !id) return;

        try {
            setAddingItem(true);
            setError(null);
            setSuccess(null);

            await InventoryService.addItemToInventory(Number(id), Number(selectedItemId));

            await fetchInventory(Number(id));
            setSelectedItemId('');
            setSuccess('Item added to inventory successfully!');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to add item to inventory: ${err.message}`);
            } else {
                setError('Failed to add item to inventory');
            }
            console.error(err);
        } finally {
            setAddingItem(false);
        }
    };

    const handleCreateAndAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;

        try {
            setAddingItem(true);
            setError(null);
            setSuccess(null);

            if (!newItem.name.trim()) {
                setError('Item name is required');
                setAddingItem(false);
                return;
            }

            if (!newItem.description.trim()) {
                setError('Item description is required');
                setAddingItem(false);
                return;
            }

            if (newItem.price <= 0) {
                setError('Price must be greater than 0');
                setAddingItem(false);
                return;
            }

            if (newItem.quantity <= 0) {
                setError('Quantity must be greater than 0');
                setAddingItem(false);
                return;
            }

            const createdItem = await ItemService.createItem({
                ...newItem,
                inventoryId: Number(id)
            });

            await fetchInventory(Number(id));

            setNewItem({
                name: '',
                description: '',
                price: 0,
                quantity: 1
            });
            setShowNewItemForm(false);
            setSuccess('Item created and added to inventory successfully!');

            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to create item: ${err.message}`);
            } else {
                setError('Failed to create item');
            }
            console.error(err);
        } finally {
            setAddingItem(false);
        }
    };

    const handleNewItemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewItem(prev => ({
            ...prev,
            [name]: name === 'price' || name === 'quantity' ? Number(value) : value
        }));
    };

    if (loading) {
        return <div className="container mx-auto p-4">Loading...</div>;
    }

    if (!inventory) {
        return (
            <div className="container mx-auto p-4">
                <p>Inventory not found</p>
                <Link href="/Inventory" className="text-blue-500 hover:underline">
                    Back to Inventory List
                </Link>
            </div>
        );
    }

    // Helper function to check if tab is active
    const isActive = (path: string) => {
        return router.pathname === path;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Add Items to {inventory.name}</h1>

            {/* Navigation */}
            <div className="mb-6">
                <Link
                    href={`/Inventory/${id}`}
                    className="text-blue-500 hover:underline mr-4"
                >
                    ← Back to Inventory
                </Link>
            </div>

            {/* Navigation Tabs */}
            <div className="mb-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    <Link
                        href={`/Inventory/${id}`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Overview
                    </Link>

                    <Link
                        href={`/Inventory/${id}/add`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/add')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Add Items
                    </Link>

                    <Link
                        href={`/Inventory/${id}/manage`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/manage')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Manage Items
                    </Link>

                    <Link
                        href={`/Inventory/${id}/sell`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/sell')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Sell Items
                    </Link>

                    <Link
                        href={`/Inventory/${id}/history`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/history')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Sales History
                    </Link>
                </nav>
            </div>

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* Add Existing Item */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-xl font-semibold mb-4">Add Existing Item</h2>
                <form onSubmit={handleAddExistingItem}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                            Select Item
                        </label>
                        <select
                            value={selectedItemId}
                            onChange={(e) => setSelectedItemId(e.target.value ? Number(e.target.value) : '')}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            disabled={addingItem}
                        >
                            <option value="">-- Select an item --</option>
                            {availableItems
                                .filter(item => !inventory.items.some(invItem => invItem.id === item.id))
                                .map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} - ${item.price.toFixed(2)}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={!selectedItemId || addingItem}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                    >
                        {addingItem ? 'Adding...' : 'Add to Inventory'}
                    </button>
                </form>
            </div>

            {/* Create New Item */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Create New Item</h2>
                    <button
                        onClick={() => setShowNewItemForm(!showNewItemForm)}
                        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                    >
                        {showNewItemForm ? 'Cancel' : 'New Item'}
                    </button>
                </div>

                {showNewItemForm && (
                    <form onSubmit={handleCreateAndAddItem}>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={newItem.name}
                                onChange={handleNewItemChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                disabled={addingItem}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={newItem.description}
                                onChange={handleNewItemChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                rows={3}
                                disabled={addingItem}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Price
                            </label>
                            <input
                                type="number"
                                name="price"
                                value={newItem.price}
                                onChange={handleNewItemChange}
                                step="0.01"
                                min="0"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                disabled={addingItem}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Quantity
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={newItem.quantity}
                                onChange={handleNewItemChange}
                                min="1"
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                disabled={addingItem}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addingItem}
                            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                        >
                            {addingItem ? 'Creating...' : 'Create & Add to Inventory'}
                        </button>
                    </form>
                )}
            </div>

            {/* Current Items */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-xl font-semibold mb-4">Current Items ({inventory.items.length})</h2>
                {inventory.items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Name</th>
                                <th className="py-2 px-4 border-b text-left">Description</th>
                                <th className="py-2 px-4 border-b text-left">Price</th>
                                <th className="py-2 px-4 border-b text-left">Quantity</th>
                            </tr>
                            </thead>
                            <tbody>
                            {inventory.items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">{item.name}</td>
                                    <td className="py-2 px-4 border-b">{item.description}</td>
                                    <td className="py-2 px-4 border-b">${item.price.toFixed(2)}</td>
                                    <td className="py-2 px-4 border-b">{item.quantity}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No items yet. Add some items to get started!</p>
                )}
            </div>
        </div>
    );
}
