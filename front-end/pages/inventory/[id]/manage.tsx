import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import PriceVariablesSection from '../../../components/inventory/PriceVariablesSection';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
import Toast from '../../../components/common/Toast';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { getInventoryById, updateItem, deleteItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { useToast } from '../../../hooks/useToast';
import { Item, Inventory } from '@types';

const ManageItemsPage = () => {
    const router = useRouter();
    const { id: inventoryIdParam } = router.query;
    const { data: session } = useSession();
    const { toast, showToast } = useToast();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [itemBeingEdited, setItemBeingEdited] = useState<Item | null>(null);
    const [expandedPricesItemId, setExpandedPricesItemId] = useState<number | null>(null);
    const [deleteConfirmItemId, setDeleteConfirmItemId] = useState<number | null>(null);

    useEffect(() => {
        if (inventoryIdParam) void fetchInventory();
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

    const handleSaveItem = async () => {
        if (!itemBeingEdited?.id) return;
        try {
            await updateItem(itemBeingEdited.id, {
                name: itemBeingEdited.name || '',
                description: itemBeingEdited.description || '',
                buyPrice: itemBeingEdited.buyPrice ?? 0,
                quantity: itemBeingEdited.quantity ?? 0,
            });
            await fetchInventory();
            setItemBeingEdited(null);
            showToast('Item updated successfully');
        } catch (err: any) {
            showToast(err.message || 'Failed to update item', 'error');
        }
    };

    const handleDeleteItem = async (itemId: number) => {
        try {
            await deleteItem(itemId);
            await fetchInventory();
            setDeleteConfirmItemId(null);
            showToast('Item deleted');
        } catch (err: any) {
            showToast(err.message || 'Failed to delete item', 'error');
            setDeleteConfirmItemId(null);
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

    return (
        <>
            <Header />
            <Toast toast={toast} />

            {deleteConfirmItemId !== null && (
                <ConfirmDialog
                    title="Delete item?"
                    description="This action cannot be undone."
                    confirmLabel="Delete"
                    onConfirm={() => handleDeleteItem(deleteConfirmItemId)}
                    onCancel={() => setDeleteConfirmItemId(null)}
                />
            )}

            <div className="container mx-auto px-4 py-8">
                <Link
                    href="/inventory"
                    className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                >
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={currentUserRole}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="manage"
                    onManageUsers={() => setShowManageUsersModal(true)}
                />

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Manage Items ({inventory.items?.length || 0})
                    </h2>

                    {inventory.items && inventory.items.length > 0 ? (
                        <div className="space-y-4">
                            {inventory.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                    <div className="bg-gray-50 p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 grid grid-cols-4 gap-4">
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Name
                                                    </div>
                                                    {itemBeingEdited?.id === item.id ? (
                                                        <input
                                                            type="text"
                                                            value={itemBeingEdited!.name ?? ''}
                                                            onChange={(e) =>
                                                                setItemBeingEdited({
                                                                    ...itemBeingEdited!,
                                                                    name: e.target.value,
                                                                })
                                                            }
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="font-medium">
                                                            {item.name}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Description
                                                    </div>
                                                    {itemBeingEdited?.id === item.id ? (
                                                        <input
                                                            type="text"
                                                            value={
                                                                itemBeingEdited!.description ?? ''
                                                            }
                                                            onChange={(e) =>
                                                                setItemBeingEdited({
                                                                    ...itemBeingEdited!,
                                                                    description: e.target.value,
                                                                })
                                                            }
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-sm">
                                                            {item.description}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Buy Price
                                                    </div>
                                                    {itemBeingEdited?.id === item.id ? (
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            value={itemBeingEdited!.buyPrice ?? 0}
                                                            onChange={(e) =>
                                                                setItemBeingEdited({
                                                                    ...itemBeingEdited!,
                                                                    buyPrice: parseFloat(
                                                                        e.target.value,
                                                                    ),
                                                                })
                                                            }
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div className="text-green-600 font-medium">
                                                            €{Number(item.buyPrice || 0).toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="text-xs text-gray-500 mb-1">
                                                        Quantity
                                                    </div>
                                                    {itemBeingEdited?.id === item.id ? (
                                                        <input
                                                            type="number"
                                                            value={itemBeingEdited!.quantity ?? 0}
                                                            onChange={(e) =>
                                                                setItemBeingEdited({
                                                                    ...itemBeingEdited!,
                                                                    quantity: parseInt(
                                                                        e.target.value,
                                                                    ),
                                                                })
                                                            }
                                                            className="w-full px-2 py-1 border border-gray-300 rounded"
                                                        />
                                                    ) : (
                                                        <div>{item.quantity}</div>
                                                    )}
                                                </div>
                                            </div>
                                            {canEdit && (
                                                <div className="ml-4 flex gap-2">
                                                    {itemBeingEdited?.id === item.id ? (
                                                        <>
                                                            <button
                                                                onClick={handleSaveItem}
                                                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setItemBeingEdited(null)
                                                                }
                                                                className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() =>
                                                                    setItemBeingEdited({ ...item })
                                                                }
                                                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    setExpandedPricesItemId(
                                                                        expandedPricesItemId ===
                                                                            item.id
                                                                            ? null
                                                                            : (item.id ?? null),
                                                                    )
                                                                }
                                                                className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                                            >
                                                                {expandedPricesItemId === item.id
                                                                    ? '▼'
                                                                    : '▶'}{' '}
                                                                Prices
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    item.id &&
                                                                    setDeleteConfirmItemId(item.id)
                                                                }
                                                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                                            >
                                                                Delete
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {expandedPricesItemId === item.id && item.id && (
                                        <PriceVariablesSection itemId={item.id} canEdit={canEdit} />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">
                            No items in this inventory.
                        </div>
                    )}
                </div>

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

export default ManageItemsPage;
