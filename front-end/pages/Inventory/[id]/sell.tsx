import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Header from '../../../components/header';
import InventoryHeader from '../../../components/InventoryHeader';
import ManageUsersModal from '../../../components/ManageUsersModal';
import { getInventoryById, createSoldItem } from '../../../lib/api';
import { useSession } from '../../../lib/auth-client';

type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
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
    quantity: number;
    price: number;
};

const SellPage = () => {
    const router = useRouter();
    const { id } = router.query;
    const { data: session } = useSession();

    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellPrice, setSellPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card'>('cash');

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

    const handleSelectItem = (item: Item) => {
        setSelectedItem(item);
        setSellQuantity(1);
        setSellPrice(item.price);
    };

    const handleAddToCart = () => {
        if (!selectedItem) return;

        const existingItemIndex = cart.findIndex(cartItem => cartItem.item.id === selectedItem.id);

        if (existingItemIndex >= 0) {
            const updatedCart = [...cart];
            updatedCart[existingItemIndex].quantity += sellQuantity;
            setCart(updatedCart);
        } else {
            setCart([...cart, {
                item: selectedItem,
                quantity: sellQuantity,
                price: sellPrice
            }]);
        }

        setSelectedItem(null);
        alert('Item added to cart!');
    };

    const handleSellNow = async () => {
        if (!selectedItem) return;

        try {
            await createSoldItem({
                itemId: selectedItem.id,
                sellingPrice: sellPrice,
                quantity: sellQuantity,
                payedCash: paymentMethod === 'cash',
                soldAt: new Date().toISOString()
            } as any);

            setSelectedItem(null);
            fetchInventory();
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
                await createSoldItem({
                    itemId: cartItem.item.id,
                    sellingPrice: cartItem.price,
                    quantity: cartItem.quantity,
                    payedCash: true,
                    soldAt: new Date().toISOString()
                } as any);
            }

            setCart([]);
            fetchInventory();
            alert('All items sold successfully!');
        } catch (error) {
            console.error('Error checking out:', error);
            alert('Failed to checkout');
        }
    };

    const getTotalCartValue = () => {
        return cart.reduce((total, cartItem) => total + (cartItem.price * cartItem.quantity), 0);
    };

    const removeFromCart = (itemId: number) => {
        setCart(cart.filter(cartItem => cartItem.item.id !== itemId));
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
    const availableItems = inventory.items.filter(item => item.quantity > 0);

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
                        activeTab="sell"
                        onManageUsers={() => setShowManageUsers(true)}
                    />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Available Items */}
                        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Available Items</h2>

                            {availableItems.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {availableItems.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleSelectItem(item)}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                                                    {item.name}
                                                </h3>
                                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          Stock: {item.quantity}
                        </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                                            <div className="text-lg font-bold text-green-600">${item.price.toFixed(2)}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <p>No items available for sale</p>
                                </div>
                            )}
                        </div>

                        {/* Sell Form / Cart */}
                        <div>
                            {selectedItem ? (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Selling: {selectedItem.name}</h2>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                min="1"
                                                max={selectedItem.quantity}
                                                value={sellQuantity}
                                                onChange={(e) => setSellQuantity(parseInt(e.target.value) || 1)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Price
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={sellPrice}
                                                    onChange={(e) => setSellPrice(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Payment Method
                                            </label>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setPaymentMethod('cash')}
                                                    className={`flex-1 px-4 py-2 border rounded-lg ${
                                                        paymentMethod === 'cash'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    Cash
                                                </button>
                                                <button
                                                    onClick={() => setPaymentMethod('card')}
                                                    className={`flex-1 px-4 py-2 border rounded-lg ${
                                                        paymentMethod === 'card'
                                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    Card
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="flex justify-between items-center text-lg font-bold">
                                                <span>Total:</span>
                                                <span className="text-green-600">${(sellPrice * sellQuantity).toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <button
                                                onClick={handleAddToCart}
                                                className="flex-1 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
                                            >
                                                Add to Cart
                                            </button>
                                            <button
                                                onClick={handleSellNow}
                                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                            >
                                                Sell Now
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => setSelectedItem(null)}
                                            className="w-full px-4 py-2 text-gray-600 hover:text-gray-900"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Cart</h2>

                                    {cart.length > 0 ? (
                                        <>
                                            <div className="space-y-3 mb-4">
                                                {cart.map((cartItem) => (
                                                    <div key={cartItem.item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                                        <div className="flex-1">
                                                            <h4 className="font-medium text-gray-900">{cartItem.item.name}</h4>
                                                            <p className="text-xs text-gray-500">
                                                                {cartItem.quantity}x @ ${cartItem.price.toFixed(2)}
                                                            </p>
                                                            <p className="text-sm font-semibold text-green-600 mt-1">
                                                                ${(cartItem.price * cartItem.quantity).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(cartItem.item.id)}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="border-t border-gray-200 pt-4 mb-4">
                                                <div className="flex justify-between items-center text-lg font-bold">
                                                    <span>Total:</span>
                                                    <span className="text-green-600">${getTotalCartValue().toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleCheckout}
                                                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                                            >
                                                Checkout ({cart.length} items)
                                            </button>
                                        </>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <p>Your cart is empty</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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

export default SellPage;
