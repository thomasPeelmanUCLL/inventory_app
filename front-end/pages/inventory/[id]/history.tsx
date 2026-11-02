import { useCallback, useEffect, useState } from 'react';
import InventoryPageLayout from '../../../components/inventory/InventoryPageLayout';
import HistoryStatsCards from '../../../components/history/HistoryStatsCards';
import SalesHistoryTable from '../../../components/history/SalesHistoryTable';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { deleteSoldItem, getSoldItemsByInventoryId } from '../../../lib/api';
import { useInventoryPage } from '../../../hooks/useInventoryPage';
import { useToast } from '../../../hooks/useToast';
import { SoldItem } from '@types';

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

const HistoryPage = () => {
    const page = useInventoryPage();
    const { inventoryId } = page;
    const { toast, showToast } = useToast();

    const [salesHistory, setSalesHistory] = useState<SoldItem[]>([]);
    const [revertingInProgressId, setRevertingInProgressId] = useState<number | null>(null);
    const [revertConfirmSaleId, setRevertConfirmSaleId] = useState<number | null>(null);

    const loadSales = useCallback(async () => {
        if (!inventoryId) return;
        try {
            setSalesHistory(await getSoldItemsByInventoryId(inventoryId));
        } catch (err) {
            showToast(errorMessage(err, 'Failed to load sales history'), 'error');
        }
        // showToast is recreated every render; keying on it would refetch every render
    }, [inventoryId]);

    useEffect(() => {
        void loadSales();
    }, [loadSales]);

    const handleRevertSale = async (saleId: number) => {
        try {
            setRevertingInProgressId(saleId);
            await deleteSoldItem(saleId);
            await Promise.all([loadSales(), page.reload()]);
            showToast('Sale reverted successfully');
        } catch (err) {
            showToast(errorMessage(err, 'Failed to revert sale'), 'error');
        } finally {
            setRevertingInProgressId(null);
            setRevertConfirmSaleId(null);
        }
    };

    const totalRevenue = salesHistory.reduce((sum, sale) => sum + Number(sale.finalSellPrice) * sale.quantity, 0);
    const totalItemsSold = salesHistory.reduce((sum, sale) => sum + sale.quantity, 0);

    return (
        <InventoryPageLayout page={page} activeTab="history" toast={toast}>
            {() => (
                <>
                    {revertConfirmSaleId !== null && (
                        <ConfirmDialog
                            title="Revert this sale?"
                            description="The item quantity will be restored."
                            confirmLabel="Revert"
                            onConfirm={() => handleRevertSale(revertConfirmSaleId)}
                            onCancel={() => setRevertConfirmSaleId(null)}
                        />
                    )}

                    <div className="mt-8">
                        <HistoryStatsCards
                            totalRevenue={totalRevenue}
                            totalItems={totalItemsSold}
                            totalTransactions={salesHistory.length}
                        />
                    </div>

                    <SalesHistoryTable
                        sales={salesHistory}
                        canEdit={page.canEdit}
                        revertingId={revertingInProgressId}
                        onRevert={setRevertConfirmSaleId}
                    />
                </>
            )}
        </InventoryPageLayout>
    );
};

export default HistoryPage;
