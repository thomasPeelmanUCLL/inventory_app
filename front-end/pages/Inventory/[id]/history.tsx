import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import HistoryStatsCards from '../../../components/history/HistoryStatsCards';
import SalesHistoryTable from '../../../components/history/SalesHistoryTable';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
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
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [revertingId, setRevertingId] = useState<number | null>(null);
    const [revertConfirm, setRevertConfirm] = useState<number | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        if (id) {
            void fetchInventory();
            void fetchSalesHistory();
        }
    }, [id]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getInventoryById(Number(id));
            setInventory(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesHistory = async () => {
        try {
            const data = await getSoldItemsByInventoryId(Number(id));
            setSalesHistory(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load sales history');
        }
    };

    const handleRevertSale = async (saleId: number) => {
        try {
            setRevertingId(saleId);
            await deleteSoldItem(saleId);
            await fetchSalesHistory();
            await fetchInventory();
            setRevertConfirm(null);
            showToast('Sale reverted successfully');
        } catch (err: any) {
            showToast(err.message || 'Failed to revert sale', 'error');
        } finally {
            setRevertingId(null);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    if (loading) return (<><Header /><LoadingScreen /></>);
    if (error) return (<><Header /><ErrorScreen message={error} onRetry={fetchInventory} /></>);
    if (!inventory) return (<><Header /><ErrorScreen message="Inventory not found" /></>);

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';
    const totalRevenue = salesHistory.reduce((t, s) => t + s.finalSellPrice * s.quantity, 0);
    const totalItems = salesHistory.reduce((t, s) => t + s.quantity, 0);

    return (
        <>
            <Header />

            {/* Toast */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg text-white font-medium ${
                    toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
                }`}>
                    {toast.message}
                </div>
            )}

            {/* Revert confirm dialog */}
            {revertConfirm !== null && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
                        <h3 className="text-lg font-bold mb-2">Revert this sale?</h3>
                        <p className="text-gray-600 mb-6">The item quantity will be restored.</p>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setRevertConfirm(null)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                                Cancel
                            </button>
                            <button onClick={() => handleRevertSale(revertConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                Revert
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                <Link href="/Inventory" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory} role={role} canEdit={canEdit} isOwner={isOwner}
                    activeTab="history" onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="mt-8">
                    <HistoryStatsCards
                        totalRevenue={totalRevenue} totalItems={totalItems}
                        totalTransactions={salesHistory.length}
                    />
                </div>

                <SalesHistoryTable
                    sales={salesHistory} canEdit={canEdit} revertingId={revertingId}
                    onRevert={(id) => setRevertConfirm(id)}
                />

                {showManageUsers && (
                    <ManageUsersModal
                        inventoryId={Number(id)} isOwner={isOwner}
                        onClose={() => { setShowManageUsers(false); void fetchInventory(); }}
                    />
                )}
            </div>
        </>
    );
};

export default HistoryPage;
