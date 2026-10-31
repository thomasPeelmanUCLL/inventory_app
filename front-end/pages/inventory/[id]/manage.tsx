import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import PriceVariablesSection from '../../../components/inventory/PriceVariablesSection';
import WebsiteCatalogueSection, {
    WebsiteCatalogueFormErrors,
    WebsiteCatalogueFormValues,
} from '../../../components/inventory/WebsiteCatalogueSection';
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
    const [catalogueErrors, setCatalogueErrors] = useState<WebsiteCatalogueFormErrors>({});

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
        setCatalogueErrors({});

        const publishEnabled = Boolean(itemBeingEdited.publishedToWebsite);
        const isValidMoney = (value: string) => /^\d+(\.\d{1,2})?$/.test(value);
        const memberPriceValue =
            itemBeingEdited.memberPrice === null || itemBeingEdited.memberPrice === undefined
                ? ''
                : String(itemBeingEdited.memberPrice);
        const nonMemberPriceValue =
            itemBeingEdited.nonMemberPrice === null || itemBeingEdited.nonMemberPrice === undefined
                ? ''
                : String(itemBeingEdited.nonMemberPrice);

        const nextErrors: WebsiteCatalogueFormErrors = {};
        if (
            itemBeingEdited.websiteSortOrder !== undefined &&
            itemBeingEdited.websiteSortOrder !== null &&
            !Number.isInteger(itemBeingEdited.websiteSortOrder)
        ) {
            nextErrors.websiteSortOrder = 'Sort order must be an integer';
        }
        if (publishEnabled && !itemBeingEdited.websiteCategory?.trim()) {
            nextErrors.websiteCategory = 'Website category is required when publishing';
        }
        if (publishEnabled && !memberPriceValue) {
            nextErrors.memberPrice = 'Member price is required when publishing';
        } else if (memberPriceValue && !isValidMoney(memberPriceValue)) {
            nextErrors.memberPrice = 'Member price must be a non-negative amount with 2 decimals';
        }
        if (publishEnabled && !nonMemberPriceValue) {
            nextErrors.nonMemberPrice = 'Non-member price is required when publishing';
        } else if (nonMemberPriceValue && !isValidMoney(nonMemberPriceValue)) {
            nextErrors.nonMemberPrice =
                'Non-member price must be a non-negative amount with 2 decimals';
        }
        if (Object.keys(nextErrors).length > 0) {
            setCatalogueErrors(nextErrors);
            return;
        }

        try {
            await updateItem(itemBeingEdited.id, {
                name: itemBeingEdited.name || '',
                description: itemBeingEdited.description || '',
                buyPrice: itemBeingEdited.buyPrice ?? 0,
                quantity: itemBeingEdited.quantity ?? 0,
                websiteCategory: itemBeingEdited.websiteCategory?.trim() || null,
                websiteEmoji: itemBeingEdited.websiteEmoji?.trim() || null,
                websiteSortOrder: itemBeingEdited.websiteSortOrder ?? 0,
                memberPrice:
                    itemBeingEdited.memberPrice === undefined
                        ? null
                        : (itemBeingEdited.memberPrice ?? null),
                nonMemberPrice:
                    itemBeingEdited.nonMemberPrice === undefined
                        ? null
                        : (itemBeingEdited.nonMemberPrice ?? null),
                publishedToWebsite: Boolean(itemBeingEdited.publishedToWebsite),
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
                                                            {item.publishedToWebsite && (
                                                                <span className="ml-2 inline-flex text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
                                                                    Published
                                                                </span>
                                                            )}
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
                                                                onClick={() => {
                                                                    setCatalogueErrors({});
                                                                    setItemBeingEdited({
                                                                        ...item,
                                                                        websiteCategory:
                                                                            item.websiteCategory ??
                                                                            '',
                                                                        websiteEmoji:
                                                                            item.websiteEmoji ?? '',
                                                                        websiteSortOrder:
                                                                            item.websiteSortOrder ??
                                                                            0,
                                                                        memberPrice:
                                                                            item.memberPrice ?? null,
                                                                        nonMemberPrice:
                                                                            item.nonMemberPrice ??
                                                                            null,
                                                                        publishedToWebsite:
                                                                            Boolean(
                                                                                item.publishedToWebsite,
                                                                            ),
                                                                    });
                                                                }}
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
                                    {itemBeingEdited?.id === item.id && (() => {
                                        const editingItem = itemBeingEdited;
                                        if (!editingItem) return null;
                                        return (
                                            <div className="p-4 border-t border-gray-200">
                                                <WebsiteCatalogueSection
                                                    value={{
                                                        publishedToWebsite: Boolean(
                                                            editingItem.publishedToWebsite,
                                                        ),
                                                        websiteCategory:
                                                            editingItem.websiteCategory ?? '',
                                                        websiteEmoji:
                                                            editingItem.websiteEmoji ?? '',
                                                        websiteSortOrder: String(
                                                            editingItem.websiteSortOrder ?? 0,
                                                        ),
                                                        memberPrice:
                                                            editingItem.memberPrice === null ||
                                                            editingItem.memberPrice === undefined
                                                                ? ''
                                                                : String(editingItem.memberPrice),
                                                        nonMemberPrice:
                                                            editingItem.nonMemberPrice === null ||
                                                            editingItem.nonMemberPrice === undefined
                                                                ? ''
                                                                : String(
                                                                      editingItem.nonMemberPrice,
                                                                  ),
                                                    }}
                                                    errors={catalogueErrors}
                                                    onChange={(field, fieldValue) => {
                                                        if (!itemBeingEdited) return;
                                                        if (field === 'publishedToWebsite') {
                                                            setItemBeingEdited({
                                                                ...itemBeingEdited,
                                                                publishedToWebsite:
                                                                    fieldValue as boolean,
                                                            });
                                                            return;
                                                        }
                                                        if (field === 'websiteSortOrder') {
                                                            setItemBeingEdited({
                                                                ...itemBeingEdited,
                                                                websiteSortOrder:
                                                                    (fieldValue as string) === ''
                                                                        ? 0
                                                                        : parseInt(
                                                                              fieldValue as string,
                                                                              10,
                                                                          ),
                                                            });
                                                            return;
                                                        }
                                                        if (field === 'memberPrice') {
                                                            setItemBeingEdited({
                                                                ...itemBeingEdited,
                                                                memberPrice:
                                                                    (fieldValue as string) === ''
                                                                        ? null
                                                                        : parseFloat(
                                                                              fieldValue as string,
                                                                          ),
                                                            });
                                                            return;
                                                        }
                                                        if (field === 'nonMemberPrice') {
                                                            setItemBeingEdited({
                                                                ...itemBeingEdited,
                                                                nonMemberPrice:
                                                                    (fieldValue as string) === ''
                                                                        ? null
                                                                        : parseFloat(
                                                                              fieldValue as string,
                                                                          ),
                                                            });
                                                            return;
                                                        }
                                                        setItemBeingEdited({
                                                            ...itemBeingEdited,
                                                            [field]: fieldValue as string,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        );
                                    })()}
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
