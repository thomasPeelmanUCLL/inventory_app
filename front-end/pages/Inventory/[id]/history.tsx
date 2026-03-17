import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import HistoryStatsCards from '../../../components/history/HistoryStatsCards';
import SalesHistoryTable from '../../../components/history/SalesHistoryTable';
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
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchSalesHistory = async () => {
        try {
            const data = await getSoldItemsByInventoryId(Number(id));
            setSalesHistory(data);
        } catch (error) { console.error(error); }
    };

    const handleRevertSale = async (saleId: number) => {
        if (!confirm('Revert this sale? The item quantity will be restored.')) return;
        try {
            setRevertingId(saleId);
            await deleteSoldItem(saleId);
            await fetchSalesHistory();
            await fetchInventory();
        } catch { alert('Failed to revert sale'); }
        finally { setRevertingId(null); }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    if (loading) return (<><Header /><div className="container mx-auto px-4 py-8">Loading...</div></>);
    if (!inventory) return (<><Header /><div className="container mx-auto px-4 py-8">Inventory not found</div></>);

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';
    const totalRevenue = salesHistory.reduce((t, s) => t + s.finalSellPrice * s.quantity, 0);
    const totalItems = salesHistory.reduce((t, s) => t + s.quantity, 0);

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">← Back to Inventories</Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="history"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="mt-8">
                    <HistoryStatsCards
                        totalRevenue={totalRevenue}
                        totalItems={totalItems}
                        totalTransactions={salesHistory.length}
                    />
                </div>

                <SalesHistoryTable
                    sales={salesHistory}
                    canEdit={canEdit}
                    revertingId={revertingId}
                    onRevert={handleRevertSale}
                />

                {showManageUsers && (
                    <ManageUsersModal
                        inventoryId={Number(id)}
                        isOwner={isOwner}
                        onClose={() => { setShowManageUsers(false); void fetchInventory(); }}
                    />
                )}
            </div>
        </>
    );
};

export default HistoryPage;
