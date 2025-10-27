import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import ItemCard from '../../../components/ItemCard';
import SellModal from '../../../components/SellModal';
import CartSidebar from '../../../components/CartSidebar';
import { getInventoryById, getPriceVariablesByInventoryId, sellItems } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, CartItem, SellModalData, PriceVariable } from '@types';

const SellPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [sellModal, setSellModal] = useState<SellModalData | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    useEffect(() => {
        if (id) {
            fetchInventory();
            fetchPriceVariables();
        }
    }, [id]);

    const fetchInventory = async () => {
        try {
            setLoading(true);
            const data = await getInventoryById(Number(id));
            setInventory(data);
        } catch (error) {
            console.error('Error fetching inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPriceVariables = async () => {
        try {
            const data = await getPriceVariablesByInventoryId(Number(id));
            setPriceVariables(data);
        } catch (error) {
            console.error('Error fetching price variables:', error);
        }
    };

    const getUserRole = () => {
        if (!inventory || !session?.user) return 'viewer';
        return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
    };

    const handleItemClick = (item: Item) => {
        setSellModal({
            item,
            quantity: 1,
            finalSellPrice: Number(item.buyPrice),
            priceVariableName: undefined,
            isCustomPrice: false,
            paymentMethod: 'card'
        });
    };

    const handleAddToCart = () => {
        if (!sellModal) return;

        const existingItem = cart.find(c => c.item.id === sellModal.item.id);

        if (existingItem) {
            setCart(cart.map(c =>
                c.item.id === sellModal.item.id
                    ? {
                        ...c,
                        quantityToSell: c.quantityToSell + sellModal.quantity,
                        finalSellPrice: sellModal.finalSellPrice,
                        priceVariableName: sellModal.priceVariableName,
                        isCustomPrice: sellModal.isCustomPrice
                    }
                    : c
            ));
        } else {
            setCart([...cart, {
                item: sellModal.item,
                quantityToSell: sellModal.quantity,
                finalSellPrice: sellModal.finalSellPrice,
                priceVariableName: sellModal.priceVariableName,
                isCustomPrice: sellModal.isCustomPrice
            }]);
        }

        setSellModal(null);
        setIsCartOpen(true);
    };

    const handleBuyNow = async () => {
        if (!sellModal || !sellModal.item.id) return;

        const payload = {
            itemId: sellModal.item.id,
            finalSellPrice: sellModal.finalSellPrice,  // REMOVE Number() wrapper!
            priceVariableName: sellModal.priceVariableName,
            isCustomPrice: sellModal.isCustomPrice || false,
            quantity: sellModal.quantity,
            payedCash: sellModal.paymentMethod === 'cash'
        };


        console.log('🔍 Sending payload:', payload);
        console.log('🔍 finalSellPrice is NaN?', isNaN(payload.finalSellPrice));

        try {
            await sellItems(Number(id), { items: [payload] });

            await fetchInventory();
            setSellModal(null);
            alert('Item sold successfully!');
        } catch (error) {
            console.error('Error selling item:', error);
            alert('Failed to sell item');
        }
    };


    const handleCheckout = async () => {
        try {
            const itemsToSell = cart.map(cartItem => ({
                itemId: cartItem.item.id!,
                finalSellPrice: cartItem.finalSellPrice,
                priceVariableName: cartItem.priceVariableName,
                isCustomPrice: cartItem.isCustomPrice,
                quantity: cartItem.quantityToSell,
                payedCash: false
            }));

            await sellItems(Number(id), { items: itemsToSell });

            setCart([]);
            setIsCartOpen(false);
            await fetchInventory();
            alert('Checkout successful!');
        } catch (error) {
            console.error('Error during checkout:', error);
            alert('Checkout failed');
        }
    };

    const handleRemoveFromCart = (itemId: number) => {
        setCart(cart.filter(c => c.item.id !== itemId));
    };

    const handleUpdateCartQuantity = (itemId: number, quantity: number) => {
        setCart(cart.map(c =>
            c.item.id === itemId ? { ...c, quantityToSell: quantity } : c
        ));
    };

    if (loading) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">Loading...</div>
            </>
        );
    }

    if (!inventory) {
        return (
            <>
                <Header />
                <div className="container mx-auto px-4 py-8">Inventory not found</div>
            </>
        );
    }

    const role = getUserRole();
    const canEdit = role === 'owner' || role === 'editor';
    const isOwner = role === 'owner';

    return (
        <>
            <Header />
            <div className="container mx-auto px-4 py-8">
                <Link href="/inventory" className="text-blue-500 hover:text-blue-700 mb-4 inline-block">
                    ← Back to Inventories
                </Link>

                <InventoryHeader
                    inventory={inventory}
                    role={role}
                    canEdit={canEdit}
                    isOwner={isOwner}
                    activeTab="sell"
                    onManageUsers={() => setShowManageUsers(true)}
                />

                <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold">Select Items to Sell</h2>
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors relative"
                        >
                            Cart ({cart.length})
                            {cart.length > 0 && (
                                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                                    {cart.reduce((sum, item) => sum + item.quantityToSell, 0)}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {inventory.items && inventory.items.length > 0 ? (
                            inventory.items
                                .filter(item => item.quantity > 0)
                                .map((item) => (
                                    <ItemCard
                                        key={item.id}
                                        item={item}
                                        onClick={() => handleItemClick(item)}
                                    />
                                ))
                        ) : (
                            <p className="text-gray-500 col-span-full text-center py-8">No items available to sell</p>
                        )}
                    </div>
                </div>
            </div>

            {sellModal && (
                <SellModal
                    sellModal={sellModal}  // Change from 'data' to 'sellModal'
                    priceVariables={priceVariables}
                    onClose={() => setSellModal(null)}
                    onAddToCart={handleAddToCart}
                    onBuyNow={handleBuyNow}
                    onChange={setSellModal}
                />
            )}

            {isCartOpen && (
                <CartSidebar
                    cart={cart}
                    onClose={() => setIsCartOpen(false)}
                    onCheckout={handleCheckout}
                    onRemoveItem={handleRemoveFromCart}
                    onUpdateQuantity={handleUpdateCartQuantity}
                />
            )}

            {showManageUsers && (
                <ManageUsersModal
                    inventoryId={inventory.id}
                    isOwner={isOwner}
                    onClose={() => {
                        setShowManageUsers(false);
                        fetchInventory();
                    }}
                />
            )}
        </>
    );
};

export default SellPage;
