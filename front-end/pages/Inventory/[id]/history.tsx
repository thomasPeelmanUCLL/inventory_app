import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, getSoldItemsByInventoryId } from '../../../lib/api';
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

type SoldItem = {
    id: number;
    itemId: number;
    sellingPrice: number;
    quantity: number;
    payedCash: boolean;
    soldAt: string;
    item?: {
        name: string;
        description: string;
    };
};

const HistoryPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [salesHistory, setSalesHistory] = useState<SoldItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [inventoryData, salesData] = await Promise.all([
                getInventoryById(Number(id)),
                getSoldItemsByInventoryId(Number(id))
            ]);
            setInventory(inventoryData);
            setSalesHistory(salesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
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
        return salesHistory.reduce((total, sale) => total + (sale.sellingPrice * sale.quantity), 0);
    };

    const calculateTotalItems = () => {
        return salesHistory.reduce((total, sale) => total + sale.quantity, 0);
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
                        activeTab="history"
                        onManageUsers={() => setShowManageUsers(true)}
                    />

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Sales</h3>
                            <p className="text-3xl font-bold text-green-600">${calculateTotal().toFixed(2)}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Items Sold</h3>
                            <p className="text-3xl font-bold text-blue-600">{calculateTotalItems()}</p>
                        </div>
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Transactions</h3>
                            <p className="text-3xl font-bold text-purple-600">{salesHistory.length}</p>
                        </div>
                    </div>

                    {/* Sales Table */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {salesHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
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
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment
                                        </th>
                                    </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                    {salesHistory.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(sale.soldAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {sale.item ? sale.item.name : 'Unknown Item'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {sale.quantity}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                ${sale.sellingPrice.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                                ${(sale.sellingPrice * sale.quantity).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              sale.payedCash
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-blue-100 text-blue-800'
                          }`}>
                            {sale.payedCash ? 'Cash' : 'Card'}
                          </span>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                    />
                                </svg>
                                <p className="text-gray-500 mt-4">No sales recorded yet.</p>
                                <Link href={`/Inventory/${id}/sell`}>
                                    <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                                        Start selling items
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
                            fetchData();
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default HistoryPage;
