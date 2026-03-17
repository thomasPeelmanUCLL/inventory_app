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
    const { id } = router.query;
    const { data: session } = useSession();
    const { toast, showToast } = useToast();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [sellModal, setSellModal] = useState<SellModalData | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => { if (id) void fetchInventory(); }, [id]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getInventoryById(Number(id));
            setInventory(data);
            await fetchAllPriceVariables(data.items);
        } catch (err: any) {
            setError(err.message || 'Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPriceVariables = async (items: Item[]) => {
        if (!items || items.length === 0) { setPriceVariables([]); return; }
        try {
            const results = await Promise.all(items.filter(i => i.id).map(i => getPriceVariablesByItemId(i.id!)));
            setPriceVariables(results.flat());
        } catch {
            setPriceVariables([]);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    const handleItemClick = (item: Item) => {
        setSellModal({ item, quantity: 1, finalSellPrice: item.buyPrice || 0, paymentMethod: 'cash' });
    };

    const handleAddToCart = () => {
        if (!sellModal) return;
        const existing = cart.find(ci =>
            ci.item.id === sellModal.item.id &&
            ci.priceVariableName === sellModal.priceVariableName &&
            ci.isCustomPrice === sellModal.isCustomPrice
        );
        if (existing) {
            setCart(cart.map(ci =>
                ci.item.id === sellModal.item.id &&
                ci.priceVariableName === sellModal.priceVariableName &&
                ci.isCustomPrice === sellModal.isCustomPrice
                    ? { ...ci, quantityToSell: ci.quantityToSell + sellModal.quantity }
                    : ci
            ));
        } else {
            setCart([...cart, {
                item: sellModal.item,
                quantityToSell: sellModal.quantity,
                finalSellPrice: sellModal.finalSellPrice,
                priceVariableName: sellModal.priceVariableName,
                isCustomPrice: sellModal.isCustomPrice,
            }]);
        }
        setSellModal(null);
        setIsCartOpen(true);
    };

    const handleBuyNow = async () => {
        if (!sellModal || !sellModal.item.id) return;
        try {
            await createSoldItem({
                itemId: sellModal.item.id,
                finalSellPrice: sellModal.finalSellPrice,
                quantity: sellModal.quantity,
                priceVariableName: sellModal.priceVariableName,
                isCustomPrice: sellModal.isCustomPrice || false,
                payedCash: sellModal.paymentMethod === 'cash',
            });
            await fetchInventory();
            setSellModal(null);
            showToast('Item sold successfully!');
        } catch (err: any) {
            showToast(err.message || 'Failed to sell item', 'error');
        }
    };

    const handleRemoveFromCart = (itemId: number) => setCart(cart.filter(ci => ci.item.id !== itemId));

    const handleUpdateCartQuantity = (itemId: number, quantity: number) =>
        setCart(cart.map(ci => ci.item.id === itemId ? { ...ci, quantityToSell: quantity } : ci));

    const handleCheckout = async (payedCash: boolean) => {
        try {
            await Promise.all(
                cart.filter(ci => ci.item.id).map(ci => createSoldItem({
                    itemId: ci.item.id!,
                    finalSellPrice: ci.finalSellPrice,
                    quantity: ci.quantityToSell,
                    priceVariableName: ci.priceVariableName,
                    isCustomPrice: ci.isCustomPrice || false,
                    payedCash,
                }))
            );
            setCart([]);
            setIsCartOpen(false);
            await fetchInventory();
            showToast('Checkout successful!');
        } catch (err: any) {
            showToast(err.message || 'Checkout failed', 'error');
        }
    };

    if (loading) return (<><Header /><LoadingScreen /></>);
    if (error) return (<><Header /><ErrorScreen message={error} onRetry={fetchInventory} /></>);
    if (!inventory) return (<><Header /><ErrorScreen message="Inventory not found" /></>);

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';
    const itemPriceVariables = sellModal?.item.id ? priceVariables.filter(pv => pv.itemId === sellModal.item.id) : [];

    return (
        <>
            <Header />
            <Toast toast={toast} />

            <div className="container mx-auto px-4 py-8">
                <Link href="/Inventory" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory} role={role} canEdit={canEdit} isOwner={isOwner}
                    activeTab="overview" onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        Items ({inventory.items?.length || 0})
                    </h2>
                    <ItemsGrid items={inventory.items || []} onItemClick={handleItemClick} />
                </div>

                {sellModal && (
                    <SellModal
                        sellModal={sellModal} priceVariables={itemPriceVariables}
                        onClose={() => setSellModal(null)} onAddToCart={handleAddToCart}
                        onBuyNow={handleBuyNow} onChange={setSellModal}
                    />
                )}

                {isCartOpen && (
                    <CartSidebar
                        cart={cart} onClose={() => setIsCartOpen(false)}
                        onRemoveItem={handleRemoveFromCart} onUpdateQuantity={handleUpdateCartQuantity}
                        onCheckout={handleCheckout}
                    />
                )}

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

export default InventoryOverviewPage;
