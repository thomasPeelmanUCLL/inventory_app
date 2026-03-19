import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import HistoryStatsCards from '../../../components/history/HistoryStatsCards';
import SalesHistoryTable from '../../../components/history/SalesHistoryTable';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
import Toast from '../../../components/common/Toast';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { getInventoryById, getSoldItemsByInventoryId, deleteSoldItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { useToast } from '../../../hooks/useToast';
import { Inventory, SoldItem } from '@types';

const HistoryPage = () => {
    const router = useRouter();
    const { id: inventoryIdParam } = router.query;
    const { data: session } = useSession();
    const { toast, showToast } = useToast();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [salesHistory, setSalesHistory] = useState<SoldItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [revertingInProgressId, setRevertingInProgressId] = useState<number | null>(null);
    const [revertConfirmSaleId, setRevertConfirmSaleId] = useState<number | null>(null);

    useEffect(() => {
        if (inventoryIdParam) {
            void fetchInventory();
            void fetchSalesHistory();
        }
    }, [inventoryIdParam]);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const fetchedInventory = await getInventoryById(Number(inventoryIdParam));
            setInventory(fetchedInventory);
        } catch (err: any) {
            setLoadError(err.message || 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSalesHistory = async () => {
        try {
            const fetchedSales = await getSoldItemsByInventoryId(Number(inventoryIdParam));
            setSalesHistory(fetchedSales);
        } catch (err: any) {
            setLoadError(err.message || 'Failed to load sales history');
        }
    };

    const handleRevertSale = async (saleId: number) => {
        try {
            setRevertingInProgressId(saleId);
            await deleteSoldItem(saleId);
            await fetchSalesHistory();
            await fetchInventory();
            setRevertConfirmSaleId(null);
            showToast('Sale reverted successfully');
        } catch (err: any) {
            showToast(err.message || 'Failed to revert sale', 'error');
        } finally {
            setRevertingInProgressId(null);
        }
    };

    const getCurrentUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return (
            inventory.users?.find((member) => member.user.id === session.user.id)?.role || 'viewer'
        );
    };

    if (isLoading)
        return (
            <>
                <Header />
                <LoadingScreen />
            </>
        );
    if (loadError)
        return (
            <>
                <Header />
                <ErrorScreen message={loadError} onRetry={fetchInventory} />
            </>
        );
    if (!inventory)
        return (
            <>
                <Header />
                <ErrorScreen message="Inventory not found" />
            </>
        );

    const currentUserRole = getCurrentUserRole();
    const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';
    const isOwner = currentUserRole === 'owner';
    const totalRevenueFromSales = salesHistory.reduce(
        (runningTotal, sale) => runningTotal + sale.finalSellPrice * sale.quantity,
        0,
    );
    const totalItemsSold = salesHistory.reduce(
        (runningTotal, sale) => runningTotal + sale.quantity,
        0,
    );

    return (
        <>
            <Header />
            <Toast toast={toast} />

            {revertConfirmSaleId !== null && (
                <ConfirmDialog
                    title="Revert this sale?"
                    description="The item quantity will be restored."
                    confirmLabel="Revert"
                    onConfirm={() => handleRevertSale(revertConfirmSaleId)}
                    onCancel={() => setRevertConfirmSaleId(null)}
                />
            )}

            <div className="container mx-auto px-4 py-8">
                <Link
                    href="/inventory"
                    className="text-blue-500 hover:text-blue-700 mb-4 inline-block"
                >
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={currentUserRole}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="history"
                    onManageUsers={() => setShowManageUsersModal(true)}
                />

                <div className="mt-8">
                    <HistoryStatsCards
                        totalRevenue={totalRevenueFromSales}
                        totalItems={totalItemsSold}
                        totalTransactions={salesHistory.length}
                    />
                </div>

                <SalesHistoryTable
                    sales={salesHistory}
                    canEdit={canEdit}
                    revertingId={revertingInProgressId}
                    onRevert={(saleId) => setRevertConfirmSaleId(saleId)}
                />

                {showManageUsersModal && (
                    <ManageUsersModal
                        inventoryId={Number(inventoryIdParam)}
                        isOwner={isOwner}
                        onClose={() => {
                            setShowManageUsersModal(false);
                            void fetchInventory();
                        }}
                    />
                )}
            </div>
        </>
    );
};

export default HistoryPage;
