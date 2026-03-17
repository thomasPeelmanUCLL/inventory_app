import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/Header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ItemsGrid from '../../../components/inventory/ItemsGrid';
import SellModal from '../../../components/inventory/SellModal';
import CartSidebar from '../../../components/inventory/CartSidebar';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
import Toast from '../../../components/common/Toast';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { getInventoryById, createSoldItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { useToast } from '../../../hooks/useToast';
import { Inventory, Item, SellModalData, CartItem } from '@types';

const InventoryDetailPage = () => {
    const router = useRouter();
    const { id: inventoryIdParam } = router.query;
    const { data: session } = useSession();
    const { toast, showToast } = useToast();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [sellModal, setSellModal] = useState<SellModalData | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [showManageUsersModal, setShowManageUsersModal] = useState(false);
    const [checkoutConfirmData, setCheckoutConfirmData] = useState<{ paidWithCash: boolean } | null>(null);

    useEffect(() => { if (inventoryIdParam) void fetchInventory(); }, [inventoryIdParam]);

    const fetchInventory = async () => {
        try {
            setIsLoading(true);
            setFetchError(null);
            const fetchedInventory = await getInventoryById(Number(inventoryIdParam));
            setInventory(fetchedInventory);
        } catch (err: any) {
            setFetchError(err.message || 'Failed to load inventory');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSellItem = (item: Item) => {
        const priceVariables = item.priceVariables || [];
        const defaultPriceVariable = priceVariables.find(priceVariable => priceVariable.isDefault);
        setSellModal({
            item,
            quantity: 1,
            finalSellPrice: defaultPriceVariable
                ? (defaultPriceVariable.type === 'PERCENTAGE'
                    ? item.buyPrice * (1 + defaultPriceVariable.value / 100)
                    : defaultPriceVariable.value)
                : item.buyPrice,
            priceVariableName: defaultPriceVariable?.name,
            isCustomPrice: false,
            paymentMethod: 'cash',
        });
    };

    const handleAddToCart = () => {
        if (!sellModal) return;
        setCart(prevCart => {
            const existingCartEntry = prevCart.find(
                cartEntry => cartEntry.item.id === sellModal.item.id &&
                cartEntry.priceVariableName === sellModal.priceVariableName
            );
            if (existingCartEntry) {
                return prevCart.map(cartEntry =>
                    cartEntry.item.id === sellModal.item.id &&
                    cartEntry.priceVariableName === sellModal.priceVariableName
                        ? { ...cartEntry, quantityToSell: cartEntry.quantityToSell + sellModal.quantity }
                        : cartEntry
                );
            }
            return [...prevCart, {
                item: sellModal.item,
                quantityToSell: sellModal.quantity,
                finalSellPrice: sellModal.finalSellPrice,
                priceVariableName: sellModal.priceVariableName,
                isCustomPrice: sellModal.isCustomPrice,
            }];
        });
        setSellModal(null);
        showToast('Added to cart');
    };

    const handleBuyNow = async () => {
        if (!sellModal) return;
        try {
            await createSoldItem({
                itemId: sellModal.item.id!,
                finalSellPrice: sellModal.finalSellPrice,
                quantity: sellModal.quantity,
                priceVariableName: sellModal.priceVariableName,
                isCustomPrice: sellModal.isCustomPrice,
                paidWithCash: sellModal.paymentMethod === 'cash',
            });
            setSellModal(null);
            await fetchInventory();
            showToast('Sale recorded successfully');
        } catch (err: any) {
            showToast(err.message || 'Failed to record sale', 'error');
        }
    };

    const handleCheckout = async (paidWithCash: boolean) => {
        try {
            for (const cartEntry of cart) {
                await createSoldItem({
                    itemId: cartEntry.item.id!,
                    finalSellPrice: cartEntry.finalSellPrice,
                    quantity: cartEntry.quantityToSell,
                    priceVariableName: cartEntry.priceVariableName,
                    isCustomPrice: cartEntry.isCustomPrice,
                    paidWithCash,
                });
            }
            setCart([]);
            setShowCart(false);
            setCheckoutConfirmData(null);
            await fetchInventory();
            showToast(`Checkout successful — ${cart.length} item(s) sold`);
        } catch (err: any) {
            showToast(err.message || 'Checkout failed', 'error');
        }
    };

    const getCurrentUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(member => member.user.id === session.user.id)?.role || 'viewer';
    };

    if (isLoading) return (<><Header /><LoadingScreen /></>);
    if (fetchError) return (<><Header /><ErrorScreen message={fetchError} onRetry={fetchInventory} /></>);
    if (!inventory) return (<><Header /><ErrorScreen message="Inventory not found" /></>);

    const currentUserRole = getCurrentUserRole();
    const canEdit = currentUserRole === 'owner' || currentUserRole === 'editor';
    const isOwner = currentUserRole === 'owner';

    return (
        <>
            <Header />
            <Toast toast={toast} />

            {checkoutConfirmData && (
                <ConfirmDialog
                    title="Confirm checkout?"
                    description={`Sell ${cart.length} item(s) from cart?`}
                    confirmLabel="Checkout"
                    onConfirm={() => handleCheckout(checkoutConfirmData.paidWithCash)}
                    onCancel={() => setCheckoutConfirmData(null)}
                />
            )}

            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory} role={currentUserRole} canEdit={canEdit} isOwner={isOwner}
                    activeTab="view" onManageUsers={() => setShowManageUsersModal(true)}
                />

                {canEdit && (
                    <div className="flex justify-end mb-4">
                        <button
                            onClick={() => setShowCart(true)}
                            className="relative px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            🛒 Cart {cart.length > 0 && <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2">{cart.length}</span>}
                        </button>
                    </div>
                )}

                <ItemsGrid
                    items={inventory.items || []}
                    canEdit={canEdit}
                    onSell={handleSellItem}
                />
            </div>

            {sellModal && (
                <SellModal
                    sellModal={sellModal}
                    priceVariables={sellModal.item.priceVariables || []}
                    onClose={() => setSellModal(null)}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onChange={setSellModal}
                />
            )}

            {showCart && (
                <CartSidebar
                    cart={cart}
                    onClose={() => setShowCart(false)}
                    onRemoveItem={(itemId) => setCart(prevCart => prevCart.filter(cartEntry => cartEntry.item.id !== itemId))}
                    onUpdateQuantity={(itemId, newQuantity) => setCart(prevCart => prevCart.map(cartEntry => cartEntry.item.id === itemId ? { ...cartEntry, quantityToSell: newQuantity } : cartEntry))}
                    onCheckout={(paidWithCash) => setCheckoutConfirmData({ paidWithCash })}
                />
            )}

            {showManageUsersModal && (
                <ManageUsersModal
                    inventoryId={Number(inventoryIdParam)} isOwner={isOwner}
                    onClose={() => { setShowManageUsersModal(false); void fetchInventory(); }}
                />
            )}
        </>
    );
};

export default InventoryDetailPage;
