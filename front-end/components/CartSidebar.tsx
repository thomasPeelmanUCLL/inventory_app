type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    buyedAt?: string;
    createdAt: string;
};

type CartItem = {
    item: Item;
    quantityToSell: number;
    sellingPrice: number;
};

type Props = {
    cart: CartItem[];
    onClose: () => void;
    onRemoveItem: (itemId: number) => void;
    onClearCart: () => void;
    onCheckout: () => void;
};

const CartSidebar = ({ cart, onClose, onRemoveItem, onClearCart, onCheckout }: Props) => {
    const getTotalCartValue = () => {
        return cart.reduce((total, cartItem) => total + (cartItem.sellingPrice * cartItem.quantityToSell), 0);
    };

    return (
        <div className="w-80 bg-white rounded-lg border border-gray-200 p-6 h-fit sticky top-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Cart</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {cart.map((cartItem) => (
                    <div key={cartItem.item.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm truncate">{cartItem.item.name}</h4>
                            <p className="text-xs text-gray-500">{cartItem.quantityToSell}x @ ${cartItem.sellingPrice.toFixed(2)}</p>
                            <p className="text-sm font-semibold text-green-600 mt-1">
                                ${(cartItem.sellingPrice * cartItem.quantityToSell).toFixed(2)}
                            </p>
                        </div>
                        <button
                            onClick={() => onRemoveItem(cartItem.item.id)}
                            className="text-red-500 hover:text-red-700 flex-shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                ))}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-4">
                <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Subtotal</span>
                    <span className="text-sm font-medium">${getTotalCartValue().toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-lg font-bold text-green-600">${getTotalCartValue().toFixed(2)}</span>
                </div>
            </div>

            <div className="space-y-2">
                <button
                    onClick={onCheckout}
                    className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                >
                    Checkout ({cart.length} items)
                </button>
                <button
                    onClick={onClearCart}
                    className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Clear Cart
                </button>
            </div>
        </div>
    );
};

export default CartSidebar;
