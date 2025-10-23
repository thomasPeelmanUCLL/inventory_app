import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import InventoryService from '../../../services/InventoryService';
import ItemService from '../../../services/ItemService';
import SoldItemService from '../../../services/SoldItemService';
import Link from 'next/link';
import {Inventory, Item, SoldItem} from "@types";

interface CartItem {
    item: Item;
    quantity: number;
    price: number;
    lastSoldPrice: number | null;
}

export default function SellItems() {
    const [inventory, setInventory] = useState<Inventory | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);
    const [sellMode, setSellMode] = useState<'quick' | 'custom'>('quick');
    const [sellQuantity, setSellQuantity] = useState(1);
    const [sellPrice, setSellPrice] = useState(0);
    const [lastSoldPrice, setLastSoldPrice] = useState<number | null>(null);
    const [loadingLastPrice, setLoadingLastPrice] = useState(false);
    const [payedCash, setPayedCash] = useState(true);
    const [selling, setSelling] = useState(false);
    const [cart, setCart] = useState<CartItem[]>([]);

    const router = useRouter();
    const { id } = router.query;

    useEffect(() => {
        if (id) {
            fetchInventory(Number(id));
        }
    }, [id]);

    const fetchInventory = async (inventoryId: number) => {
        try {
            setLoading(true);
            const data = await InventoryService.getInventoryById(inventoryId);
            setInventory(data);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to load inventory: ${err.message}`);
            } else {
                setError('Failed to load inventory');
            }
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchLastSoldPrice = async (itemId: number) => {
        try {
            setLoadingLastPrice(true);
            const soldItems = await SoldItemService.getSoldItemsByItemId(itemId);

            if (soldItems && soldItems.length > 0) {
                const sortedItems = soldItems.sort((a: SoldItem, b: SoldItem) => {
                    return new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime();
                });

                const lastPrice = sortedItems[0].sellingPrice;
                setLastSoldPrice(lastPrice);
                return lastPrice;
            } else {
                setLastSoldPrice(null);
                return null;
            }
        } catch (err) {
            console.error('Error fetching last sold price:', err);
            setLastSoldPrice(null);
            return null;
        } finally {
            setLoadingLastPrice(false);
        }
    };

    const handleSelectItem = async (item: Item) => {
        setSelectedItem(item);
        setSellQuantity(1);
        setSellMode('quick');
        setError(null);
        setSuccess(null);

        const lastPrice = await fetchLastSoldPrice(item.id);
        const priceToUse = lastPrice !== null ? lastPrice : item.price;
        setSellPrice(priceToUse);
    };

    const handleAddToCart = () => {
        if (!selectedItem) return;

        if (sellQuantity > selectedItem.quantity) {
            setError(`Cannot add more than ${selectedItem.quantity} items`);
            return;
        }

        if (sellQuantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        if (sellMode === 'custom' && sellPrice <= 0) {
            setError('Price must be greater than 0');
            return;
        }

        // Check if item already in cart
        const existingCartItem = cart.find(ci => ci.item.id === selectedItem.id);

        if (existingCartItem) {
            // Update quantity
            setCart(cart.map(ci =>
                ci.item.id === selectedItem.id
                    ? { ...ci, quantity: ci.quantity + sellQuantity, price: sellPrice }
                    : ci
            ));
        } else {
            // Add new item to cart
            setCart([...cart, {
                item: selectedItem,
                quantity: sellQuantity,
                price: sellPrice,
                lastSoldPrice: lastSoldPrice
            }]);
        }

        setSuccess(`Added ${sellQuantity}x ${selectedItem.name} to cart`);
        setTimeout(() => setSuccess(null), 2000);

        // Reset selection
        setSelectedItem(null);
        setLastSoldPrice(null);
        setSellQuantity(1);
    };

    const handleRemoveFromCart = (itemId: number) => {
        setCart(cart.filter(ci => ci.item.id !== itemId));
    };

    const calculateCartTotal = () => {
        return cart.reduce((total, ci) => total + (ci.price * ci.quantity), 0);
    };

    const handleCheckoutCart = async () => {
        if (cart.length === 0) {
            setError('Cart is empty');
            return;
        }

        if (!id) return;

        try {
            setSelling(true);
            setError(null);

            // Process each cart item
            for (const cartItem of cart) {
                // Create sold item record
                await SoldItemService.createSoldItem({
                    itemId: cartItem.item.id,
                    sellingPrice: cartItem.price,
                    quantity: cartItem.quantity,
                    payedCash: payedCash,
                    soldAt: new Date().toISOString()
                });

                // Update item quantity
                await ItemService.updateItem(cartItem.item.id, {
                    ...cartItem.item,
                    quantity: cartItem.item.quantity - cartItem.quantity
                });
            }

            setSuccess(`Successfully sold ${cart.length} item(s) for $${calculateCartTotal().toFixed(2)}!`);
            setCart([]);
            await fetchInventory(Number(id));
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to complete checkout: ${err.message}`);
            } else {
                setError('Failed to complete checkout');
            }
            console.error(err);
        } finally {
            setSelling(false);
        }
    };

    const handleQuickSell = async () => {
        if (!selectedItem || !id) return;

        if (sellQuantity > selectedItem.quantity) {
            setError(`Cannot sell more than ${selectedItem.quantity} items`);
            return;
        }

        if (sellQuantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        try {
            setSelling(true);
            setError(null);

            await SoldItemService.createSoldItem({
                itemId: selectedItem.id,
                sellingPrice: sellPrice,
                quantity: sellQuantity,
                payedCash: payedCash,
                soldAt: new Date().toISOString()
            });

            await ItemService.updateItem(selectedItem.id, {
                ...selectedItem,
                quantity: selectedItem.quantity - sellQuantity
            });

            await fetchInventory(Number(id));
            setSelectedItem(null);
            setLastSoldPrice(null);
            setSuccess(`Successfully sold ${sellQuantity} x ${selectedItem.name}!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to complete sale: ${err.message}`);
            } else {
                setError('Failed to complete sale');
            }
            console.error(err);
        } finally {
            setSelling(false);
        }
    };

    const handleCustomSell = async () => {
        if (!selectedItem || !id) return;

        if (sellQuantity > selectedItem.quantity) {
            setError(`Cannot sell more than ${selectedItem.quantity} items`);
            return;
        }

        if (sellQuantity <= 0) {
            setError('Quantity must be greater than 0');
            return;
        }

        if (sellPrice <= 0) {
            setError('Price must be greater than 0');
            return;
        }

        try {
            setSelling(true);
            setError(null);

            await SoldItemService.createSoldItem({
                itemId: selectedItem.id,
                sellingPrice: sellPrice,
                quantity: sellQuantity,
                payedCash: payedCash,
                soldAt: new Date().toISOString()
            });

            await ItemService.updateItem(selectedItem.id, {
                ...selectedItem,
                quantity: selectedItem.quantity - sellQuantity
            });

            await fetchInventory(Number(id));
            setSelectedItem(null);
            setLastSoldPrice(null);
            setSuccess(`Successfully sold ${sellQuantity} x ${selectedItem.name} at $${sellPrice.toFixed(2)} each!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            if (err instanceof Error) {
                setError(`Failed to complete sale: ${err.message}`);
            } else {
                setError('Failed to complete sale');
            }
            console.error(err);
        } finally {
            setSelling(false);
        }
    };

    const filteredItems = (inventory?.items || []).filter(item =>
            item.quantity > 0 && (
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            )
    );


    if (loading) {
        return <div className="container mx-auto p-4">Loading...</div>;
    }

    if (!inventory) {
        return (
            <div className="container mx-auto p-4">
                <p>Inventory not found</p>
                <Link href="/Inventory" className="text-blue-500 hover:underline">
                    Back to Inventory List
                </Link>
            </div>
        );
    }

    const isActive = (path: string) => {
        return router.pathname === path;
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-4">Sell Items from {inventory.name}</h1>

            <div className="mb-6">
                <Link
                    href={`/Inventory/${id}`}
                    className="text-blue-500 hover:underline mr-4"
                >
                    ← Back to Inventory
                </Link>
            </div>

            <div className="mb-6 border-b border-gray-200">
                <nav className="flex gap-4">
                    <Link
                        href={`/Inventory/${id}`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Overview
                    </Link>
                    <Link
                        href={`/Inventory/${id}/add`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/add')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Add Items
                    </Link>
                    <Link
                        href={`/Inventory/${id}/manage`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/manage')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Manage Items
                    </Link>
                    <Link
                        href={`/Inventory/${id}/sell`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/sell')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Sell Items
                    </Link>
                    <Link
                        href={`/Inventory/${id}/history`}
                        className={`py-2 px-4 border-b-2 font-medium ${
                            isActive('/Inventory/[id]/history')
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                        }`}
                    >
                        Sales History
                    </Link>
                </nav>
            </div>

            {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                    {success}
                </div>
            )}

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Available Items */}
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                    <h2 className="text-xl font-semibold mb-4">Available Items</h2>

                    <div className="mb-4">
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                    </div>

                    {filteredItems.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white border">
                                <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-4 border-b text-left">Name</th>
                                    <th className="py-2 px-4 border-b text-left">Available</th>
                                    <th className="py-2 px-4 border-b text-left">Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredItems.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={`hover:bg-gray-50 cursor-pointer ${selectedItem?.id === item.id ? 'bg-blue-50' : ''}`}
                                        onClick={() => handleSelectItem(item)}
                                    >
                                        <td className="py-2 px-4 border-b">{item.name}</td>
                                        <td className="py-2 px-4 border-b">{item.quantity}</td>
                                        <td className="py-2 px-4 border-b">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelectItem(item);
                                                }}
                                                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded text-sm"
                                            >
                                                Select
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-gray-500">No items available for sale.</p>
                    )}
                </div>

                {/* Sell Panel */}
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                    <h2 className="text-xl font-semibold mb-4">Sell Item</h2>

                    {selectedItem ? (
                        <div>
                            <div className="mb-4 p-4 bg-gray-50 rounded">
                                <h3 className="font-bold text-lg mb-2">{selectedItem.name}</h3>
                                <p className="text-gray-700 mb-2">{selectedItem.description}</p>
                                {loadingLastPrice ? (
                                    <p className="text-gray-600">Loading price...</p>
                                ) : lastSoldPrice !== null ? (
                                    <p className="text-green-600 font-semibold text-lg">Last Sold: ${lastSoldPrice.toFixed(2)}</p>
                                ) : (
                                    <p className="text-orange-600 font-semibold">No previous sales - set custom price</p>
                                )}
                                <p className="text-gray-600 mt-2">Available: {selectedItem.quantity}</p>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Sell Mode
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSellMode('quick')}
                                        disabled={lastSoldPrice === null}
                                        className={`flex-1 py-2 px-4 rounded ${
                                            sellMode === 'quick'
                                                ? 'bg-blue-500 text-white'
                                                : lastSoldPrice === null
                                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Quick Sell
                                    </button>
                                    <button
                                        onClick={() => setSellMode('custom')}
                                        className={`flex-1 py-2 px-4 rounded ${
                                            sellMode === 'custom'
                                                ? 'bg-blue-500 text-white'
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        Custom Price
                                    </button>
                                </div>
                                {lastSoldPrice === null && (
                                    <p className="text-sm text-orange-600 mt-2">
                                        Quick Sell disabled - no previous sales found. Use Custom Price.
                                    </p>
                                )}
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Quantity
                                </label>
                                <input
                                    type="number"
                                    value={sellQuantity}
                                    onChange={(e) => setSellQuantity(Number(e.target.value))}
                                    min="1"
                                    max={selectedItem.quantity}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>

                            {sellMode === 'custom' && (
                                <div className="mb-4">
                                    <label className="block text-gray-700 text-sm font-bold mb-2">
                                        Custom Price (per item)
                                    </label>
                                    <input
                                        type="number"
                                        value={sellPrice}
                                        onChange={(e) => setSellPrice(Number(e.target.value))}
                                        step="0.01"
                                        min="0"
                                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    />
                                </div>
                            )}

                            {sellMode === 'quick' && lastSoldPrice !== null && (
                                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                                    <p className="text-sm text-gray-700">
                                        Quick Sell Price: <span className="font-bold text-blue-600">${sellPrice.toFixed(2)}</span> per item
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Using last sold price</p>
                                </div>
                            )}

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">
                                    Payment Method
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={payedCash}
                                            onChange={() => setPayedCash(true)}
                                            className="mr-2"
                                        />
                                        Cash
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            checked={!payedCash}
                                            onChange={() => setPayedCash(false)}
                                            className="mr-2"
                                        />
                                        Card/Other
                                    </label>
                                </div>
                            </div>

                            <div className="mb-4 p-4 bg-blue-50 rounded">
                                <p className="text-xl font-bold">
                                    Total: ${(sellPrice * sellQuantity).toFixed(2)}
                                </p>
                            </div>

                            <div className="flex gap-2">
                                {sellMode === 'quick' ? (
                                    <button
                                        onClick={handleQuickSell}
                                        disabled={selling || lastSoldPrice === null}
                                        className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                                    >
                                        {selling ? 'Processing...' : 'Complete Sale'}
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleCustomSell}
                                        disabled={selling}
                                        className="flex-1 bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                                    >
                                        {selling ? 'Processing...' : 'Complete Sale'}
                                    </button>
                                )}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={selling}
                                    className="flex-1 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
                                >
                                    Add to Cart
                                </button>
                                <button
                                    onClick={() => {
                                        setSelectedItem(null);
                                        setLastSoldPrice(null);
                                    }}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-500">Select an item from the list to sell.</p>
                    )}
                </div>

                {/* Shopping Cart */}
                <div className="bg-white shadow-md rounded px-8 pt-6 pb-8">
                    <h2 className="text-xl font-semibold mb-4">Shopping Cart ({cart.length})</h2>

                    {cart.length > 0 ? (
                        <div>
                            <div className="max-h-96 overflow-y-auto mb-4">
                                {cart.map((cartItem) => (
                                    <div key={cartItem.item.id} className="border-b border-gray-200 py-3 last:border-b-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-800">{cartItem.item.name}</h3>
                                                <p className="text-sm text-gray-600">
                                                    {cartItem.quantity}x @ ${cartItem.price.toFixed(2)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveFromCart(cartItem.item.id)}
                                                className="text-red-500 hover:text-red-700 ml-2"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-right font-bold text-gray-800">
                                            ${(cartItem.price * cartItem.quantity).toFixed(2)}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-gray-300 pt-4 mb-4">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xl font-bold">Total:</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        ${calculateCartTotal().toFixed(2)}
                                    </span>
                                </div>

                                <button
                                    onClick={handleCheckoutCart}
                                    disabled={selling}
                                    className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
                                >
                                    {selling ? 'Processing...' : 'Checkout Cart'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                            <p className="text-gray-500">Your cart is empty</p>
                            <p className="text-sm text-gray-400 mt-2">Add items to start selling</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
