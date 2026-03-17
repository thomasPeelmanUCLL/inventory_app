import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ItemsGrid from '../../../components/inventory/ItemsGrid';
import SellModal from '../../../components/inventory/SellModal';
import CartSidebar from '../../../components/inventory/CartSidebar';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
import Toast from '../../../components/common/Toast';
import { getInventoryById, createSoldItem, getPriceVariablesByItemId } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { useToast } from '../../../hooks/useToast';
import { Item, Inventory, CartItem, SellModalData, PriceVariable } from '@types';

const InventoryOverviewPage = () => {
    const router = useRouter();
    const { id: inventoryIdParam } = router.query;
    const { data: session } = useSession();
    const { toast, showToast } = useToast();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [allPriceVariables, setAllPriceVariables] = useState<PriceVariable[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [activeSellModal, setActiveSellModal] = useState<SellModalData | null>(null);
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => { if (inventoryIdParam) void fetchInventory(); }, [inventoryIdParam]);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const fetchedInventory = await getInventoryById(Number(inventoryIdParam));
            setInventory(fetchedInventory);
            await fetchAllItemPriceVariables(fetchedInventory.items);
        } catch (err: any) {
            setLoadError(err.message || 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAllItemPriceVariables = async (items: Item[]) => {
        if (!items || items.length === 0) { setAllPriceVariables([]); return; }
        try {
            const priceVariableResults = await Promise.all(
                items.filter(item => item.id).map(item => getPriceVariablesByItemId(item.id!))
            );
            setAllPriceVariables(priceVariableResults.flat());
        } catch {
            setAllPriceVariables([]);
        }
    };

    const getCurrentUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(member => member.user.id === session.user.id)?.role || 'viewer';
    };

    const handleItemClick = (clickedItem: Item) => {
        setActiveSellModal({ item: clickedItem, quantity: 1, finalSellPrice: clickedItem.buyPrice || 0, paymentMethod: 'cash' });
    };

    const handleAddToCart = () => {
        if (!activeSellModal) return;
        const existingCartEntry = cartItems.find(cartEntry =>
            cartEntry.item.id === activeSellModal.item.id &&
            cartEntry.priceVariableName === activeSellModal.priceVariableName &&
            cartEntry.isCustomPrice === activeSellModal.isCustomPrice
        );
        if (existingCartEntry) {
            setCartItems(cartItems.map(cartEntry =>
                cartEntry.item.id === activeSellModal.item.id &&
                cartEntry.priceVariableName === activeSellModal.priceVariableName &&
                cartEntry.isCustomPrice === activeSellModal.isCustomPrice
                    ? { ...cartEntry, quantityToSell: cartEntry.quantityToSell + activeSellModal.quantity }
                    : cartEntry
            ));
        } else {
            setCartItems([...cartItems, {
                item: activeSellModal.item,
                quantityToSell: activeSellModal.quantity,
                finalSellPrice: activeSellModal.finalSellPrice,
                priceVariableName: activeSellModal.priceVariableName,
                isCustomPrice: activeSellModal.isCustomPrice,
            }]);
        }
        setActiveSellModal(null);
        setIsCartOpen(true);
    };

    const handleBuyNow = async () => {
        if (!activeSellModal || !activeSellModal.item.id) return;
        try {
            await createSoldItem({
                itemId: activeSellModal.item.id,
                finalSellPrice: activeSellModal.finalSellPrice,
                quantity: activeSellModal.quantity,
                priceVariableName: activeSellModal.priceVariableName,
                isCustomPrice: activeSellModal.isCustomPrice || false,
                paidWithCash: activeSellModal.paymentMethod === 'cash',
            });
            await fetchInventory();
            setActiveSellModal(null);
            showToast('Item sold successfully!');
        } catch (err: any) {
            showToast(err.message || 'Failed to sell item', 'error');
        }
    };

    const handleRemoveFromCart = (itemId: number) =>
        setCartItems(cartItems.filter(cartEntry => cartEntry.item.id !== itemId));

    const handleUpdateCartQuantity = (itemId: number, newQuantity: number) =>
        setCartItems(cartItems.map(cartEntry =>
            cartEntry.item.id === itemId ? { ...cartEntry, quantityToSell: newQuantity } : cartEntry
        ));

    const handleCheckout = async (paidWithCash: boolean) => {
        try {
            await Promise.all(
                cartItems.filter(cartEntry => cartEntry.item.id).map(cartEntry => createSoldItem({
                    itemId: cartEntry.item.id!,
                    finalSellPrice: cartEntry.finalSellPrice,
                    quantity: cartEntry.quantityToSell,
                    priceVariableName: cartEntry.priceVariableName,
                    isCustomPrice: cartEntry.isCustomPrice || false,
                    paidWithCash: paidWithCash,
                }))
            );
            setCartItems([]);
            setIsCartOpen(false);
            await fetchInventory();
            showToast('Checkout successful!');
        } catch (err: any) {
            showToast(err.message || 'Checkout failed', 'error');
        }
    };

    if (isLoading) return (<><Header /><LoadingScreen /></>);
    if (loadError) return (<><Header /><ErrorScreen message={loadError} onRetry={fetchInventory} /></>);
    if (!inventory) return (<><Header /><ErrorScreen message="Inventory not found" /></>);

    const currentUserRole = getCurrentUserRole();
    const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';
    const isOwner = currentUserRole === 'owner';
    const sellModalPriceVariables = activeSellModal?.item.id
        ? allPriceVariables.filter(priceVariable => priceVariable.itemId === activeSellModal.item.id)
        : [];

    return (
        <>
            <Header />
            <Toast toast={toast} />

            <div className="container mx-auto px-4 py-8">
                <Link href="/Inventory" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory} role={currentUserRole} canEdit={canEdit} isOwner={isOwner}
                    activeTab="overview" onManageUsers={() => setShowManageUsersModal(true)}
                />

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Items ({inventory.items?.length || 0})
                    </h2>
                    <ItemsGrid items={inventory.items || []} onItemClick={handleItemClick} />
                </div>

                {activeSellModal && (
                    <SellModal
                        sellModal={activeSellModal} priceVariables={sellModalPriceVariables}
                        onClose={() => setActiveSellModal(null)} onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow} onChange={setActiveSellModal}
                    />
                )}

                {isCartOpen && (
                    <CartSidebar
                        cart={cartItems} onClose={() => setIsCartOpen(false)}
                        onRemoveItem={handleRemoveFromCart} onUpdateQuantity={handleUpdateCartQuantity}
                        onCheckout={handleCheckout}
                    />
                )}

                {showManageUsersModal && (
                    <ManageUsersModal
                        inventoryId={Number(inventoryIdParam)} isOwner={isOwner}
                        onClose={() => { setShowManageUsersModal(false); void fetchInventory(); }}
                    />
                )}
            </div>
        </>
    );
};

export default InventoryOverviewPage;
