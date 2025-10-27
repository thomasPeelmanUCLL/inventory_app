import { Item, CartItem } from '@types';

type Props = {
    cart: CartItem[];
    onClose: () => void;
    onRemoveItem: (itemId: number) => void;
    onUpdateQuantity: (itemId: number, quantity: number) => void;
    onCheckout: () => void;
};

const CartSidebar = ({ cart, onClose, onRemoveItem, onUpdateQuantity, onCheckout }: Props) => {
    const getTotalCartValue = () => {
        return cart.reduce((total, cartItem) =>
            total + (cartItem.finalSellPrice * cartItem.quantityToSell), 0
        );
    };

    const getTotalItems = () => {
        return cart.reduce((total, cartItem) => total + cartItem.quantityToSell, 0);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-end z-50">
            <div className="bg-white w-full md:w-96 h-full md:h-auto md:max-h-[90vh] md:rounded-l-lg shadow-xl flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Shopping Cart</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                        ×
                    </button>
                </div>

                {/* Cart Items */}
                <div className="flex-1 overflow-y-auto p-6">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <p>Your cart is empty</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {cart.map((cartItem) => (
                                <div
                                    key={cartItem.item.id}
                                    className="border border-gray-200 rounded-lg p-4"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold">{cartItem.item.name}</h3>
                                        <button
                                            onClick={() => onRemoveItem(cartItem.item.id)}
                                            className="text-red-500 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-3">
                                        {cartItem.quantityToSell}x @ ${cartItem.finalSellPrice.toFixed(2)}
                                        {cartItem.isCustomPrice && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                                                Custom
                                            </span>
                                        )}
                                        {cartItem.priceVariableName && !cartItem.isCustomPrice && (
                                            <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                                {cartItem.priceVariableName}
                                            </span>
                                        )}
                                    </p>

                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => onUpdateQuantity(cartItem.item.id, Math.max(1, cartItem.quantityToSell - 1))}
                                                className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center">{cartItem.quantityToSell}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(cartItem.item.id, Math.min(cartItem.item.quantity, cartItem.quantityToSell + 1))}
                                                className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-100"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <span className="font-bold text-green-600">
                                            ${(cartItem.finalSellPrice * cartItem.quantityToSell).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {cart.length > 0 && (
                    <div className="p-6 border-t border-gray-200 space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Total Items:</span>
                                <span>{getTotalItems()}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total:</span>
                                <span className="text-green-600">${getTotalCartValue().toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            onClick={onCheckout}
                            className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors font-semibold"
                        >
                            Checkout
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartSidebar;
