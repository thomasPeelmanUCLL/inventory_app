import React from 'react';
import { CartItem } from '@types';

interface CartSidebarProps {
    cart: CartItem[];
    onClose: () => void;
    onRemoveItem: (itemId: number) => void;
    onUpdateQuantity: (itemId: number, quantity: number) => void;
    onCheckout: () => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
                                                     cart,
                                                     onClose,
                                                     onRemoveItem,
                                                     onUpdateQuantity,
                                                     onCheckout,
                                                 }) => {
    const getTotalPrice = () => {
        return cart.reduce((total, item) => {
            const price = Number(item.finalSellPrice || 0);
            return total + (price * item.quantityToSell);
        }, 0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold">Cart</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 text-2xl"
                        >
                            ×
                        </button>
                    </div>

                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 py-8">
                            Your cart is empty
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-6">
                                {cart.map((cartItem) => (
                                    <div key={`${cartItem.item.id}-${cartItem.priceVariableName || 'base'}`} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{cartItem.item.name}</h3>
                                                {cartItem.priceVariableName && (
                                                    <div className="text-sm text-blue-600">
                                                        {cartItem.priceVariableName}
                                                    </div>
                                                )}
                                                {cartItem.isCustomPrice && (
                                                    <div className="text-xs text-orange-600">Custom Price</div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    ${Number(cartItem.finalSellPrice || 0).toFixed(2)}
                                                </div>
                                                <div className="text-xs text-gray-500">per item</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-gray-600">Qty:</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={cartItem.item.quantity}
                                                    value={cartItem.quantityToSell}
                                                    onChange={(e) => cartItem.item.id && onUpdateQuantity(cartItem.item.id, parseInt(e.target.value))}
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    / {cartItem.item.quantity} available
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => cartItem.item.id && onRemoveItem(cartItem.item.id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-semibold">
                                                    ${(Number(cartItem.finalSellPrice || 0) * cartItem.quantityToSell).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-6">
                                <div className="flex justify-between items-center text-xl font-bold">
                                    <span>Total:</span>
                                    <span className="text-green-600">${getTotalPrice().toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={onCheckout}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Checkout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;
