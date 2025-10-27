import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ItemsGrid from '../../../components/ItemsGrid';
import SellModal from '../../../components/SellModal';
import CartSidebar from '../../../components/CartSidebar';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, createSoldItem, getPriceVariablesByInventoryId } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, CartItem, SellModalData, PriceVariable } from '@types';

const InventoryDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [sellModal, setSellModal] = useState<SellModalData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

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
      finalSellPrice: item.buyPrice,
      priceVariableName: undefined,
      isCustomPrice: false,
      paymentMethod: 'cash'
    });
  };

  const handleAddToCart = () => {
    if (!sellModal) return;

    const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === sellModal.item.id);
    if (existingItemIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingItemIndex].quantityToSell += sellModal.quantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        item: sellModal.item,
        quantityToSell: sellModal.quantity,
        finalSellPrice: sellModal.finalSellPrice,
        priceVariableName: sellModal.priceVariableName,
        isCustomPrice: sellModal.isCustomPrice
      }]);
    }

    setShowCart(true);
    setSellModal(null);
  };

  const handleBuyNow = async () => {
    if (!sellModal || !sellModal.item.id) return;

    try {
      await createSoldItem({
        itemId: sellModal.item.id,
        finalSellPrice: sellModal.finalSellPrice,
        priceVariableName: sellModal.priceVariableName,
        isCustomPrice: sellModal.isCustomPrice,
        quantity: sellModal.quantity,
        payedCash: sellModal.paymentMethod === 'cash',
        soldAt: new Date()
      });

      fetchInventory();
      setSellModal(null);
      alert('Item sold successfully!');
    } catch (error) {
      console.error('Error selling item:', error);
      alert('Failed to sell item');
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      for (const cartItem of cart) {
        if (!cartItem.item.id) continue;

        await createSoldItem({
          itemId: cartItem.item.id,
          finalSellPrice: cartItem.finalSellPrice,
          priceVariableName: cartItem.priceVariableName,
          isCustomPrice: cartItem.isCustomPrice,
          quantity: cartItem.quantityToSell,
          payedCash: true,
          soldAt: new Date()
        });
      }

      setCart([]);
      setShowCart(false);
      fetchInventory();
      alert('All items sold successfully!');
    } catch (error) {
      console.error('Error checking out:', error);
      alert('Failed to checkout');
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
              activeTab="overview"
              onManageUsers={() => setShowManageUsers(true)}
          />

          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Available Items</h2>
              <button
                  onClick={() => setShowCart(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors relative"
              >
                Cart ({cart.length})
                {cart.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                                    {cart.reduce((sum, item) => sum + item.quantityToSell, 0)}
                                </span>
                )}
              </button>
            </div>

            {inventory.items && inventory.items.length > 0 ? (
                <ItemsGrid items={inventory.items} onItemClick={handleItemClick} />
            ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No items in this inventory yet.</p>
                  {canEdit && (
                      <Link
                          href={`/inventory/${id}/add`}
                          className="inline-block mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                      >
                        Add Your First Item
                      </Link>
                  )}
                </div>
            )}
          </div>
        </div>

        {sellModal && (
            <SellModal
                sellModal={sellModal}
                priceVariables={priceVariables}
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

export default InventoryDetailPage;
