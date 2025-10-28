import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/layout/header';
import InventoryHeader from '../../../components/inventory/InventoryHeader';
import ItemsGrid from '../../../components/inventory/ItemsGrid';
import SellModal from '../../../components/inventory/SellModal';
import CartSidebar from '../../../components/inventory/CartSidebar';
import ManageUsersModal from '../../../components/inventory/ManageUsersModal';
import { getInventoryById, createSoldItem, getPriceVariablesByItemId } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';
import { Item, Inventory, CartItem, SellModalData, PriceVariable } from '@types';

const InventoryOverviewPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [priceVariables, setPriceVariables] = useState<PriceVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [sellModal, setSellModal] = useState<SellModalData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    if (id) {
      void fetchInventory();
    }
  }, [id]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const data = await getInventoryById(Number(id));
      setInventory(data);

      await fetchAllPriceVariables(data.items);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPriceVariables = async (items: Item[]) => {
    if (!items || items.length === 0) {
      setPriceVariables([]);
      return;
    }

    try {
      const allVariables: PriceVariable[] = [];

      for (const item of items) {
        if (item.id) {
          const variables = await getPriceVariablesByItemId(item.id);
          allVariables.push(...variables);
        }
      }

      setPriceVariables(allVariables);
    } catch (error) {
      console.error('Error fetching price variables:', error);
      setPriceVariables([]);
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
      finalSellPrice: item.buyPrice || 0,
      paymentMethod: 'cash',
    });
  };

  const handleAddToCart = () => {
    if (!sellModal) return;

    // Check both item.id AND priceVariableName to distinguish separate entries
    const existingCartItem = cart.find(
        ci =>
            ci.item.id === sellModal.item.id &&
            ci.priceVariableName === sellModal.priceVariableName &&
            ci.isCustomPrice === sellModal.isCustomPrice
    );

    if (existingCartItem) {
      // Same item with same price variable -> add to quantity
      setCart(cart.map(ci =>
          ci.item.id === sellModal.item.id &&
          ci.priceVariableName === sellModal.priceVariableName &&
          ci.isCustomPrice === sellModal.isCustomPrice
              ? { ...ci, quantityToSell: ci.quantityToSell + sellModal.quantity }
              : ci
      ));
    } else {
      // Different price variable or new item -> add as separate entry
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
      alert('Item sold successfully!');
    } catch (error) {
      console.error('Error selling item:', error);
      alert('Failed to sell item');
    }
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart(cart.filter(ci => ci.item.id !== itemId));
  };

  const handleUpdateCartQuantity = (itemId: number, quantity: number) => {
    setCart(cart.map(ci =>
        ci.item.id === itemId ? { ...ci, quantityToSell: quantity } : ci
    ));
  };

  const handleCheckout = async () => {
    try {
      for (const cartItem of cart) {
        if (!cartItem.item.id) continue;

        await createSoldItem({
          itemId: cartItem.item.id,
          finalSellPrice: cartItem.finalSellPrice,
          quantity: cartItem.quantityToSell,
          priceVariableName: cartItem.priceVariableName,
          isCustomPrice: cartItem.isCustomPrice || false,
          payedCash: false,
        });
      }

      setCart([]);
      setIsCartOpen(false);
      await fetchInventory();
      alert('Checkout successful!');
    } catch (error) {
      console.error('Error during checkout:', error);
      alert('Checkout failed');
    }
  };

  if (loading) {
    return (
        <>
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center">Loading...</div>
          </div>
        </>
    );
  }

  if (!inventory) {
    return (
        <>
          <Header />
          <div className="container mx-auto px-4 py-8">
            <div className="text-center text-red-600">Inventory not found</div>
          </div>
        </>
    );
  }

  const role = getUserRole();
  const canEdit = role === 'owner' || role === 'editor';
  const isOwner = role === 'owner';

  const itemPriceVariables = sellModal?.item.id
      ? priceVariables.filter(pv => pv.itemId === sellModal.item.id)
      : [];

  return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Link
              href="/inventory"
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
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

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Items ({inventory.items?.length || 0})
            </h2>

            <ItemsGrid
                items={inventory.items || []}
                onItemClick={handleItemClick}
            />
          </div>

          {sellModal && (
              <SellModal
                  sellModal={sellModal}
                  priceVariables={itemPriceVariables}
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
                  onRemoveItem={handleRemoveFromCart}
                  onUpdateQuantity={handleUpdateCartQuantity}
                  onCheckout={handleCheckout}
              />
          )}

          {showManageUsers && (
              <ManageUsersModal
                  inventoryId={Number(id)}
                  isOwner={isOwner}
                  onClose={() => {
                    setShowManageUsers(false);
                    void fetchInventory();
                  }}
              />
          )}
        </div>
      </>
  );
};

export default InventoryOverviewPage;
