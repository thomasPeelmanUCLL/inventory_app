import { useState } from 'react';
import InventoryPageLayout from '../../../components/inventory/InventoryPageLayout';
import ManageItemRow from '../../../components/inventory/ManageItemRow';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { deleteItem, ItemPayload, updateItem } from '../../../lib/api';
import { useInventoryPage } from '../../../hooks/useInventoryPage';
import { useToast } from '../../../hooks/useToast';

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

const ManageItemsPage = () => {
    const page = useInventoryPage();
    const { toast, showToast } = useToast();
    const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<number | null>(null);

    const handleSaveItem = async (itemId: number, patch: Partial<ItemPayload>) => {
        try {
            await updateItem(itemId, patch);
            await page.reload();
            showToast('Item updated successfully');
            return true;
        } catch (err) {
            showToast(errorMessage(err, 'Failed to update item'), 'error');
            return false;
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            await deleteItem(itemId);
            await page.reload();
            showToast('Item deleted');
        } catch (err) {
            showToast(errorMessage(err, 'Failed to delete item'), 'error');
        } finally {
            setDeleteConfirmItemId(null);
        }
    };

    return (
        <InventoryPageLayout page={page} activeTab="manage" toast={toast}>
            {(inventory) => (
                <>
                    {deleteConfirmItemId !== null && (
                        <ConfirmDialog
                            title="Delete item?"
                            description="This action cannot be undone."
                            confirmLabel="Delete"
                            onConfirm={() => handleDeleteItem(deleteConfirmItemId)}
                            onCancel={() => setDeleteConfirmItemId(null)}
                        />
                    )}

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Manage Items ({inventory.items?.length || 0})
                        </h2>

                        {inventory.items?.length ? (
                            <div className="space-y-4">
                                {inventory.items.map((item) => (
                                    <ManageItemRow
                                        key={item.id}
                                        item={item}
                                        canEdit={page.canEdit}
                                        onSave={(patch) => handleSaveItem(item.id!, patch)}
                                        onDelete={() => setDeleteConfirmItemId(item.id!)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-8">No items in this inventory.</div>
                        )}
                    </div>
                </>
            )}
        </InventoryPageLayout>
    );
};

export default ManageItemsPage;
