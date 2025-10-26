import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ItemsGrid from '../../../components/ItemsGrid';
import SellModal from '../../../components/SellModal';
import CartSidebar from '../../../components/CartSidebar';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, createSoldItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';

type Item = {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  buyedAt?: string;
  createdAt: string;
};

type Inventory = {
  id: number;
  name: string;
  description: string;
  items: Item[];
  users?: Array<{
    role: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

type CartItem = {
  item: Item;
  quantityToSell: number;
  sellingPrice: number;
};

type SellModalData = {
  item: Item;
  quantity: number;
  price: number;
  paymentMethod: 'cash' | 'card';
};

const InventoryDetailPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();

  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [showManageUsers, setShowManageUsers] = useState(false);
  const [sellModal, setSellModal] = useState<SellModalData | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    if (id) {
      fetchInventory();
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

  const getUserRole = () => {
    if (!inventory || !session?.user) return 'viewer';
    return inventory.users?.find(u => u.user.id === session.user.id)?.role || 'viewer';
  };

  const handleItemClick = (item: Item) => {
    setSellModal({
      item,
      quantity: 1,
      price: item.price,
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
        sellingPrice: sellModal.price
      }]);
    }

    setShowCart(true);
    setSellModal(null);
  };

  const handleBuyNow = async () => {
    if (!sellModal) return;

    try {
      await createSoldItem({
        itemId: sellModal.item.id,
        sellingPrice: sellModal.price,
        quantity: sellModal.quantity,
        payedCash: sellModal.paymentMethod === 'cash',
        soldAt: new Date().toISOString()
      } as any);

      setSellModal(null);
      fetchInventory();
      alert('Item sold successfully!');
    } catch (error) {
      console.error('Error selling item:', error);
      alert('Failed to sell item');
    }
  };

  const handleRemoveFromCart = (itemId: number) => {
    setCart(cart.filter(cartItem => cartItem.item.id !== itemId));
    if (cart.length <= 1) {
      setShowCart(false);
    }
  };

  const handleClearCart = () => {
    if (confirm('Clear all items from cart?')) {
      setCart([]);
      setShowCart(false);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      for (const cartItem of cart) {
        await createSoldItem({
          itemId: cartItem.item.id,
          sellingPrice: cartItem.sellingPrice,
          quantity: cartItem.quantityToSell,
          payedCash: true,
          soldAt: new Date().toISOString()
        } as any);
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

  if (loading) {
    return (
        <>
          <Header />
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Loading...</div>
          </div>
        </>
    );
  }

  if (!inventory) {
    return (
        <>
          <Header />
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl">Inventory not found</div>
          </div>
        </>
    );
  }

  const role = getUserRole();
  const canEdit = role === 'owner' || role === 'editor';
  const isOwner = role === 'owner';

  return (
      <>
        <Header />
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link href="/Inventory" className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block">
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


            <div className="flex gap-6">
              <div className={`${showCart ? 'flex-1' : 'w-full'} transition-all duration-300`}>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Items</h2>
                <ItemsGrid
                    items={inventory.items}
                    inventoryId={inventory.id}
                    canEdit={canEdit}
                    onItemClick={handleItemClick}
                />
              </div>

              {showCart && cart.length > 0 && (
                  <CartSidebar
                      cart={cart}
                      onClose={() => setShowCart(false)}
                      onRemoveItem={handleRemoveFromCart}
                      onClearCart={handleClearCart}
                      onCheckout={handleCheckout}
                  />
              )}
            </div>
          </div>

          {sellModal && (
              <SellModal
                  sellModal={sellModal}
                  onClose={() => setSellModal(null)}
                  onAddToCart={handleAddToCart}
                  onBuyNow={handleBuyNow}
                  onChange={setSellModal}
              />
          )}

          {showManageUsers && inventory && (
              <ManageUsersModal
                  inventoryId={inventory.id}
                  isOwner={isOwner}
                  onClose={() => {
                    setShowManageUsers(false);
                    fetchInventory();
                  }}
              />
          )}
        </div>
      </>
  );
};

export default InventoryDetailPage;
