import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import { getInventoryById, getSoldItemsByInventoryId, deleteSoldItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Inventory, SoldItem } from '@types';

const HistoryPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [salesHistory, setSalesHistory] = useState<SoldItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [revertingId, setRevertingId] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            void fetchInventory();
            void fetchSalesHistory();
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

    const fetchSalesHistory = async () => {
        try {
            const data = await getSoldItemsByInventoryId(Number(id));
            setSalesHistory(data);
        } catch (error) {
            console.error('Error fetching sales history:', error);
        }
    };

    const handleRevertSale = async (saleId: number) => {
        if (!confirm('Are you sure you want to revert this sale? The item quantity will be restored.')) {
            return;
        }

        try {
            setRevertingId(saleId);
            await deleteSoldItem(saleId);
            await fetchSalesHistory();
            await fetchInventory();
            alert('Sale reverted successfully! Item quantity has been restored.');
        } catch (error) {
            console.error('Error reverting sale:', error);
            alert('Failed to revert sale');
        } finally {
            setRevertingId(null);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    const calculateTotal = () => {
        return salesHistory.reduce((total, sale) => total + (sale.finalSellPrice * sale.quantity), 0);
    };

    const calculateTotalItems = () => {
        return salesHistory.reduce((total, sale) => total + sale.quantity, 0);
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                <Link
                    href="/inventory"
                    className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
                >
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="history"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                {/* Statistics Cards */}
                <div className="mt-8 grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                            ${calculateTotal().toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium">Items Sold</h3>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                            {calculateTotalItems()}
                        </p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
                        <p className="text-3xl font-bold text-purple-600 mt-2">
                            {salesHistory.length}
                        </p>
                    </div>
                </div>

                {/* Sales History Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-bold">Sales History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Item
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price Each
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price Type
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                {canEdit && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                )}
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {salesHistory.length > 0 ? (
                                salesHistory.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(sale.soldAt)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {sale.item ? sale.item.name : 'Unknown Item'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {sale.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                            ${Number(sale.finalSellPrice).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            {sale.isCustomPrice ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        Custom
                                                    </span>
                                            ) : sale.priceVariableName ? (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                        {sale.priceVariableName}
                                                    </span>
                                            ) : (
                                                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                        Base
                                                    </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                            ${(sale.finalSellPrice * sale.quantity).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    sale.payedCash
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {sale.payedCash ? 'Cash' : 'Card'}
                                                </span>
                                        </td>
                                        {canEdit && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => sale.id && handleRevertSale(sale.id)}
                                                    disabled={revertingId === sale.id}
                                                    className={`px-3 py-1 rounded text-white font-medium ${
                                                        revertingId === sale.id
                                                            ? 'bg-gray-400 cursor-not-allowed'
                                                            : 'bg-red-600 hover:bg-red-700'
                                                    }`}
                                                >
                                                    {revertingId === sale.id ? 'Reverting...' : 'Revert'}
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={canEdit ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                                        No sales recorded yet.
                                    </td>
                                </tr>
                            )}
                            </tbody>
                        </table>
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

export default HistoryPage;
