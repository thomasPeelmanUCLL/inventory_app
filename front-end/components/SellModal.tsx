type Item = {
    id: number;
    name: string;
    description: string;
    price: number;
    quantity: number;
    buyedAt?: string;
    createdAt: string;
};

type SellModalData = {
    item: Item;
    quantity: number;
    price: number;
    paymentMethod: 'cash' | 'card';
};

type Props = {
    sellModal: SellModalData;
    onClose: () => void;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onChange: (data: SellModalData) => void;
};

const SellModal = ({ sellModal, onClose, onAddToCart, onBuyNow, onChange }: Props) => {
    const handleQuantityChange = (quantity: number) => {
        onChange({ ...sellModal, quantity });
    };

    const handlePriceChange = (price: number) => {
        onChange({ ...sellModal, price });
    };

    const handlePaymentMethodChange = (paymentMethod: 'cash' | 'card') => {
        onChange({ ...sellModal, paymentMethod });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-900">Sell Item</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="mb-6">
                    <h4 className="font-semibold text-lg text-gray-900">{sellModal.item.name}</h4>
                    <p className="text-sm text-gray-600">{sellModal.item.description}</p>
                    <p className="text-sm text-gray-500 mt-1">Available: {sellModal.item.quantity}</p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={sellModal.item.quantity}
                            value={sellModal.quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={sellModal.price}
                                onChange={(e) => handlePriceChange(parseFloat(e.target.value) || 0)}
                                className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handlePaymentMethodChange('cash')}
                                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                                    sellModal.paymentMethod === 'cash'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                Cash
                            </button>
                            <button
                                onClick={() => handlePaymentMethodChange('card')}
                                className={`flex-1 px-4 py-2 border rounded-lg transition-colors ${
                                    sellModal.paymentMethod === 'card'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                Card
                            </button>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between text-lg font-bold">
                            <span>Total:</span>
                            <span className="text-green-600">${(sellModal.price * sellModal.quantity).toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onAddToCart}
                        className="flex-1 px-4 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                    >
                        Add to Cart
                    </button>
                    <button
                        onClick={onBuyNow}
                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
                    >
                        Buy Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SellModal;
