import React, { useState } from 'react';
import { CartItem } from '@types';

interface CartSidebarProps {
    cart: CartItem[];
    onClose: () => void;
    onRemoveItem: (itemId: number) => void;
    onUpdateQuantity: (itemId: number, newQuantity: number) => void;
    onCheckout: (paidWithCash: boolean) => void;
}

const CartSidebar: React.FC<CartSidebarProps> = ({
    cart,
    onClose,
    onRemoveItem,
    onUpdateQuantity,
    onCheckout,
}) => {
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card'>('cash');

    const calculateCartTotal = () =>
        cart.reduce(
            (runningTotal, cartEntry) =>
                runningTotal + Number(cartEntry.finalSellPrice || 0) * cartEntry.quantityToSell,
            0,
        );

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
                        <div className="text-center text-gray-500 py-8">Your cart is empty</div>
                    ) : (
                        <>
                            <div className="space-y-4 mb-6">
                                {cart.map((cartEntry) => (
                                    <div
                                        key={`${cartEntry.item.id}-${cartEntry.priceVariableName || 'base'}`}
                                        className="border border-gray-200 rounded-lg p-4"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                <h3 className="font-semibold">
                                                    {cartEntry.item.name}
                                                </h3>
                                                {cartEntry.priceVariableName && (
                                                    <div className="text-sm text-blue-600">
                                                        {cartEntry.priceVariableName}
                                                    </div>
                                                )}
                                                {cartEntry.isCustomPrice && (
                                                    <div className="text-xs text-orange-600">
                                                        Custom Price
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-green-600">
                                                    €
                                                    {Number(cartEntry.finalSellPrice || 0).toFixed(
                                                        2,
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    per item
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between mt-3">
                                            <div className="flex items-center gap-2">
                                                <label className="text-sm text-gray-600">
                                                    Qty:
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={cartEntry.item.quantity}
                                                    value={cartEntry.quantityToSell}
                                                    onChange={(e) =>
                                                        cartEntry.item.id &&
                                                        onUpdateQuantity(
                                                            cartEntry.item.id,
                                                            parseInt(e.target.value),
                                                        )
                                                    }
                                                    className="w-20 px-2 py-1 border border-gray-300 rounded"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    / {cartEntry.item.quantity} available
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    cartEntry.item.id &&
                                                    onRemoveItem(cartEntry.item.id)
                                                }
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Subtotal:</span>
                                                <span className="font-semibold">
                                                    €
                                                    {(
                                                        Number(cartEntry.finalSellPrice || 0) *
                                                        cartEntry.quantityToSell
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-200 pt-4 mb-4">
                                <div className="flex justify-between items-center text-xl font-bold mb-4">
                                    <span>Total:</span>
                                    <span className="text-green-600">
                                        €{calculateCartTotal().toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment method
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedPaymentMethod('cash')}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                                selectedPaymentMethod === 'cash'
                                                    ? 'bg-green-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Cash
                                        </button>
                                        <button
                                            onClick={() => setSelectedPaymentMethod('card')}
                                            className={`flex-1 py-2 rounded-lg font-medium transition-colors ${
                                                selectedPaymentMethod === 'card'
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                            }`}
                                        >
                                            Card
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => onCheckout(selectedPaymentMethod === 'cash')}
                                className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                            >
                                Checkout ({selectedPaymentMethod === 'cash' ? 'Cash' : 'Card'})
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;
