import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../../services/InventoryService';
import ItemService from '../../../services/ItemService';
import Link from 'next/link';

interface Item {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
}

interface Inventory {
    id: number;
    name: string;
    description: string;
    items: Item[];
}

export default function ManageItems() {
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const [editForm, setEditForm] = useState<Item>({
        id: 0,
        name: '',
        description: '',
        price: 0,
        quantity: 0
    });

    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            fetchInventory(Number(id));
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

    const handleEdit = (item: Item) => {
        setEditingItem(item);
        setEditForm(item);
        setError(null);
        setSuccess(null);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
        setEditForm({
            id: 0,
            name: '',
            description: '',
            price: 0,
            quantity: 0
        });
    };

    const handleSaveEdit = async () => {
        if (!editingItem || !id) return;

        try {
            if (!editForm.name.trim()) {
                setError('Name is required');
                return;
            }

            if (!editForm.description.trim()) {
                setError('Description is required');
                return;
            }

            if (editForm.price <= 0) {
                setError('Price must be greater than 0');
                return;
            }

            if (editForm.quantity < 0) {
                setError('Quantity cannot be negative');
                return;
            }

            await ItemService.updateItem(editingItem.id, editForm);
            await fetchInventory(Number(id));
            setEditingItem(null);
            setSuccess('Item updated successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to update item: ${err.message}`);
            } else {
                setError('Failed to update item');
            }
            console.error(err);
        }
    };

    const handleDelete = async (itemId: number, itemName: string) => {
        if (!id) return;

        if (window.confirm(`Are you sure you want to delete "${itemName}"?`)) {
            try {
                await ItemService.deleteItem(itemId);
                await fetchInventory(Number(id));
                setSuccess('Item deleted successfully!');
                setTimeout(() => setSuccess(null), 3000);
            } catch (err) {
                if (err instanceof Error) {
                    setError(`Failed to delete item: ${err.message}`);
                } else {
                    setError('Failed to delete item');
                }
                console.error(err);
            }
        }
    };

    const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
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
            <h1 className="text-3xl font-bold mb-4">Manage Items in {inventory.name}</h1>

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

            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
                <h2 className="text-xl font-semibold mb-4">Items ({inventory.items.length})</h2>
                {inventory.items.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Name</th>
                                <th className="py-2 px-4 border-b text-left">Description</th>
                                <th className="py-2 px-4 border-b text-left">Price</th>
                                <th className="py-2 px-4 border-b text-left">Quantity</th>
                                <th className="py-2 px-4 border-b text-left">Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {inventory.items.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">
                                        {editingItem?.id === item.id ? (
                                            <input
                                                type="text"
                                                name="name"
                                                value={editForm.name}
                                                onChange={handleEditFormChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.name
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingItem?.id === item.id ? (
                                            <input
                                                type="text"
                                                name="description"
                                                value={editForm.description}
                                                onChange={handleEditFormChange}
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.description
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingItem?.id === item.id ? (
                                            <input
                                                type="number"
                                                name="price"
                                                value={editForm.price}
                                                onChange={handleEditFormChange}
                                                step="0.01"
                                                min="0"
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            `$${item.price.toFixed(2)}`
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingItem?.id === item.id ? (
                                            <input
                                                type="number"
                                                name="quantity"
                                                value={editForm.quantity}
                                                onChange={handleEditFormChange}
                                                min="0"
                                                className="border rounded px-2 py-1 w-full"
                                            />
                                        ) : (
                                            item.quantity
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {editingItem?.id === item.id ? (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-3 rounded text-sm"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancelEdit}
                                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-3 rounded text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.name)}
                                                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
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
                    <p className="text-gray-500">No items in this inventory.</p>
                )}
            </div>
        </div>
    );
}
