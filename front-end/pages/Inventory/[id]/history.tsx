import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../../services/InventoryService';
import ItemService from '../../../services/ItemService';
import SoldItemService from '../../../services/SoldItemService';
import Link from 'next/link';
import {Inventory, Item, SoldItem} from "@types";


export default function SalesHistory() {
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [salesHistory, setSalesHistory] = useState<SoldItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [reverting, setReverting] = useState<number | null>(null);

    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            fetchData(Number(id));
        }
    }, [id]);

    const fetchData = async (inventoryId: number) => {
        try {
            setLoading(true);
            // Fetch inventory
            const inventoryData = await InventoryService.getInventoryById(inventoryId);
            setInventory(inventoryData);

            // Fetch all sold items for this inventory
            const allSoldItems = await SoldItemService.getAllSoldItems();

            // Filter sold items that belong to this inventory
            const inventorySales = allSoldItems.filter((soldItem: SoldItem) => {
                return inventoryData.items.some((item: Item) => item.id === soldItem.itemId);
            });

            // Attach item info to each sold item
            const salesWithItemInfo = inventorySales.map((soldItem: SoldItem) => {
                const item = inventoryData.items.find((item: Item) => item.id === soldItem.itemId);
                return {
                    ...soldItem,
                    item: item
                };
            });

            // Sort by date, newest first
            salesWithItemInfo.sort((a: SoldItem, b: SoldItem) => {
                return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
            });

            setSalesHistory(salesWithItemInfo);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to load data: ${err.message}`);
            } else {
                setError('Failed to load data');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevertSale = async (soldItem: SoldItem) => {
        if (!soldItem.item || !id) return;

        if (!window.confirm(`Revert sale of ${soldItem.quantity}x ${soldItem.item.name}? This will restore the inventory quantity.`)) {
            return;
        }

        try {
            setReverting(soldItem.id);
            setError(null);

            // Restore the quantity to the item
            await ItemService.updateItem(soldItem.itemId, {
                ...soldItem.item,
                quantity: soldItem.item.quantity + soldItem.quantity
            });

            // Delete the sold item record
            await SoldItemService.deleteSoldItem(soldItem.id);

            setSuccess(`Successfully reverted sale of ${soldItem.quantity}x ${soldItem.item.name}`);
            setTimeout(() => setSuccess(null), 3000);

            // Refresh data
            await fetchData(Number(id));
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to revert sale: ${err.message}`);
            } else {
                setError('Failed to revert sale');
            }
            console.error(err);
        } finally {
            setReverting(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const calculateTotal = () => {
        return salesHistory.reduce((total, sale) => {
            return total + (sale.sellingPrice * sale.quantity);
        }, 0);
    };

    const calculateTotalItems = () => {
        return salesHistory.reduce((total, sale) => {
            return total + sale.quantity;
        }, 0);
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
            <h1 className="text-3xl font-bold mb-4">Sales History - {inventory.name}</h1>

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

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white shadow-md rounded p-6">
                    <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Sales</h3>
                    <p className="text-3xl font-bold text-blue-600">{salesHistory.length}</p>
                </div>
                <div className="bg-white shadow-md rounded p-6">
                    <h3 className="text-gray-600 text-sm font-semibold mb-2">Items Sold</h3>
                    <p className="text-3xl font-bold text-green-600">{calculateTotalItems()}</p>
                </div>
                <div className="bg-white shadow-md rounded p-6">
                    <h3 className="text-gray-600 text-sm font-semibold mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-purple-600">${calculateTotal().toFixed(2)}</p>
                </div>
            </div>

            {/* Sales History Table */}
            <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                <h2 className="text-xl font-semibold mb-4">Transaction History</h2>

                {salesHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border">
                            <thead className="bg-gray-100">
                            <tr>
                                <th className="py-2 px-4 border-b text-left">Date & Time</th>
                                <th className="py-2 px-4 border-b text-left">Item</th>
                                <th className="py-2 px-4 border-b text-left">Quantity</th>
                                <th className="py-2 px-4 border-b text-left">Price Each</th>
                                <th className="py-2 px-4 border-b text-left">Total</th>
                                <th className="py-2 px-4 border-b text-left">Payment</th>
                                <th className="py-2 px-4 border-b text-left">Action</th>
                            </tr>
                            </thead>
                            <tbody>
                            {salesHistory.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="py-2 px-4 border-b">
                                        {formatDate(sale.soldAt)}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        {sale.item ? sale.item.name : 'Unknown Item'}
                                    </td>
                                    <td className="py-2 px-4 border-b">{sale.quantity}</td>
                                    <td className="py-2 px-4 border-b">${sale.sellingPrice.toFixed(2)}</td>
                                    <td className="py-2 px-4 border-b font-semibold">
                                        ${(sale.sellingPrice * sale.quantity).toFixed(2)}
                                    </td>
                                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded text-xs ${
                          sale.payedCash
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}>
                        {sale.payedCash ? 'Cash' : 'Card'}
                      </span>
                                    </td>
                                    <td className="py-2 px-4 border-b">
                                        <button
                                            onClick={() => handleRevertSale(sale)}
                                            disabled={reverting === sale.id}
                                            className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm disabled:bg-gray-400"
                                        >
                                            {reverting === sale.id ? 'Reverting...' : 'Revert'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-gray-500">No sales recorded yet.</p>
                )}
            </div>
        </div>
    );
}
