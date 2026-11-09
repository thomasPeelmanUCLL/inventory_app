import { useState } from 'react';
import InventoryPageLayout from '../../../components/inventory/InventoryPageLayout';
import ItemsGrid from '../../../components/inventory/ItemsGrid';
import SellModal from '../../../components/inventory/SellModal';
import CartSidebar from '../../../components/inventory/CartSidebar';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import { createSoldItem } from '../../../lib/api';
import { getDefaultSellPriceForItem } from '../../../lib/pricing';
import { useInventoryPage } from '../../../hooks/useInventoryPage';
import { useToast } from '../../../hooks/useToast';
import { CartItem, Item, PaymentMethod, SellModalData } from '@types';
import { DEFAULT_PAYMENT_METHOD, PAYMENT_METHODS } from '../../../lib/payment';

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message) || fallback;

const sameCartLine = (entry: CartItem, sale: SellModalData) =>
    entry.item.id === sale.item.id && entry.priceVariableName === sale.priceVariableName;

const InventoryDetailPage = () => {
    const page = useInventoryPage();
    const { toast, showToast } = useToast();

    const [sellModal, setSellModal] = useState<SellModalData | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [showCart, setShowCart] = useState(false);
    const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<PaymentMethod | null>(null);

    const handleSellItem = (item: Item) => {
        const { finalSellPrice, priceVariableName } = getDefaultSellPriceForItem(item);
        setSellModal({
            item,
            quantity: 1,
            finalSellPrice,
            priceVariableName,
            isCustomPrice: false,
            paymentMethod: DEFAULT_PAYMENT_METHOD,
        });
    };

    const handleAddToCart = () => {
        if (!sellModal) return;
        setCart((prevCart) =>
            prevCart.some((entry) => sameCartLine(entry, sellModal))
                ? prevCart.map((entry) =>
                      sameCartLine(entry, sellModal)
                          ? { ...entry, quantityToSell: entry.quantityToSell + sellModal.quantity }
                          : entry,
                  )
                : [
                      ...prevCart,
                      {
                          item: sellModal.item,
                          quantityToSell: sellModal.quantity,
                          finalSellPrice: sellModal.finalSellPrice,
                          priceVariableName: sellModal.priceVariableName,
                          isCustomPrice: sellModal.isCustomPrice,
                      },
                  ],
        );
        setSellModal(null);
        showToast('Added to cart');
    };

    const sell = (entry: CartItem, paymentMethod: PaymentMethod) =>
        createSoldItem({
            itemId: entry.item.id!,
            finalSellPrice: entry.finalSellPrice,
            quantity: entry.quantityToSell,
            priceVariableName: entry.priceVariableName,
            isCustomPrice: entry.isCustomPrice,
            paymentMethod,
        });

    const handleBuyNow = async () => {
        if (!sellModal) return;
        try {
            await sell({ ...sellModal, quantityToSell: sellModal.quantity }, sellModal.paymentMethod);
            setSellModal(null);
            await page.reload();
            showToast('Sale recorded successfully');
        } catch (err) {
            showToast(errorMessage(err, 'Failed to record sale'), 'error');
        }
    };

    /** Sells the cart line by line; each line leaves the cart once sold, so a retry never sells it twice. */
    const handleCheckout = async (paymentMethod: PaymentMethod) => {
        setCheckoutPaymentMethod(null);
        let sold = 0;
        try {
            for (const entry of cart) {
                await sell(entry, paymentMethod);
                sold++;
                setCart((prevCart) => prevCart.filter((line) => line !== entry));
            }
            setShowCart(false);
            showToast(`Checkout successful — ${sold} item(s) sold`);
        } catch (err) {
            showToast(`${errorMessage(err, 'Checkout failed')} (${sold} of ${cart.length} sold)`, 'error');
        } finally {
            await page.reload();
        }
    };

    const updateCart = (itemId: number | undefined, update: (entry: CartItem) => CartItem | null) =>
        setCart((prevCart) =>
            prevCart.flatMap((entry) => {
                if (entry.item.id !== itemId) return [entry];
                const next = update(entry);
                return next ? [next] : [];
            }),
        );

    return (
        <InventoryPageLayout page={page} activeTab="overview" toast={toast}>
            {(inventory) => (
                <>
                    {checkoutPaymentMethod !== null && (
                        <ConfirmDialog
                            title="Confirm checkout?"
                            description={`Sell ${cart.length} item(s) from cart, paid by ${PAYMENT_METHODS[checkoutPaymentMethod].label.toLowerCase()}?`}
                            confirmLabel="Checkout"
                            onConfirm={() => handleCheckout(checkoutPaymentMethod)}
                            onCancel={() => setCheckoutPaymentMethod(null)}
                        />
                    )}

                    {page.canEdit && (
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowCart(true)}
                                className="relative px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                🛒 Cart{' '}
                                {cart.length > 0 && (
                                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2">
                                        {cart.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}

                    <ItemsGrid items={inventory.items || []} canEdit={page.canEdit} onSell={handleSellItem} />

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
                            onRemoveItem={(itemId) => updateCart(itemId, () => null)}
                            onUpdateQuantity={(itemId, quantityToSell) =>
                                updateCart(itemId, (entry) => ({ ...entry, quantityToSell }))
                            }
                            onCheckout={setCheckoutPaymentMethod}
                        />
                    )}
                </>
            )}
        </InventoryPageLayout>
    );
};

export default InventoryDetailPage;
