import { useState, useEffect } from 'react';
import { Item, SellModalData, PriceVariable } from '@types';

type Props = {
    sellModal: SellModalData;
    priceVariables: PriceVariable[];
    onClose: () => void;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onChange: (data: SellModalData) => void;
};

const SellModal = ({ sellModal, priceVariables, onClose, onAddToCart, onBuyNow, onChange }: Props) => {
    const [selectedPriceVariable, setSelectedPriceVariable] = useState('');
    const [customPrice, setCustomPrice] = useState('');

    // Initialize with default price variable
    useEffect(() => {
        const defaultPV = priceVariables.find(pv => pv.isDefault);
        if (defaultPV && !selectedPriceVariable && !customPrice) {
            handlePriceVariableChange(defaultPV.name);
        }
    }, [priceVariables]);

    const handleQuantityChange = (quantity: number) => {
        onChange({ ...sellModal, quantity });
    };

    const handlePriceVariableChange = (variableName: string) => {
        setSelectedPriceVariable(variableName);
        setCustomPrice('');

        if (variableName === '') {
            // Reset to base price
            onChange({
                ...sellModal,
                finalSellPrice: sellModal.item.buyPrice,
                priceVariableName: undefined,
                isCustomPrice: false
            });
        } else {
            // Find the selected price variable and calculate new price
            const priceVar = priceVariables.find(pv => pv.name === variableName);
            let newPrice = sellModal.item.buyPrice;

            if (priceVar) {
                console.log('🔍 Found price variable:', priceVar);
                console.log('🔍 Base price:', sellModal.item.buyPrice);

                if (priceVar.type === 'PERCENTAGE') {
                    // Apply percentage: price * (1 + percentage/100)
                    newPrice = sellModal.item.buyPrice * (1 + priceVar.value / 100);
                    console.log(`🔍 Percentage ${priceVar.value}%: ${newPrice}`);
                } else if (priceVar.type === 'FIXED') {
                    // Apply fixed amount: price + fixed value
                    newPrice = sellModal.item.buyPrice + priceVar.value;
                    console.log(`🔍 Fixed +${priceVar.value}: ${newPrice}`);
                }
            }

            onChange({
                ...sellModal,
                finalSellPrice: newPrice,
                priceVariableName: variableName,
                isCustomPrice: false
            });
        }
    };


    const handleCustomPriceChange = (price: string) => {
        setCustomPrice(price);
        setSelectedPriceVariable('Custom'); // Set to Custom

        const priceNum = parseFloat(price);
        if (!isNaN(priceNum) && priceNum > 0) {
            onChange({
                ...sellModal,
                finalSellPrice: priceNum,
                priceVariableName: 'Custom',
                isCustomPrice: true
            });
        }
    };

    const handlePaymentMethodChange = (paymentMethod: 'cash' | 'card') => {
        onChange({ ...sellModal, paymentMethod });
    };

    const totalPrice = sellModal.finalSellPrice * sellModal.quantity;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{sellModal.item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        ✕
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-gray-600">{sellModal.item.description}</p>
                        <p className="text-sm text-gray-500">Available: {sellModal.item.quantity}</p>
                        <p className="text-sm text-gray-500">Base Price: ${Number(sellModal.item.buyPrice).toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                            type="number"
                            min="1"
                            max={sellModal.item.quantity}
                            value={sellModal.quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {priceVariables.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Variable</label>
                            <select
                                value={selectedPriceVariable === 'Custom' ? '' : selectedPriceVariable}
                                onChange={(e) => handlePriceVariableChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Base Price</option>
                                {priceVariables.map((pv) => (
                                    <option key={pv.id} value={pv.name}>
                                        {pv.name}
                                    </option>
                                ))}
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    )}

                    {/* Only show custom price input if "Custom" is selected */}
                    {selectedPriceVariable === 'Custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Sell Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={customPrice}
                                    onChange={(e) => handleCustomPriceChange(e.target.value)}
                                    placeholder={Number(sellModal.item.buyPrice).toFixed(2)}
                                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePaymentMethodChange('card')}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                    sellModal.paymentMethod === 'card'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                💳 Card
                            </button>
                            <button
                                onClick={() => handlePaymentMethodChange('cash')}
                                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${
                                    sellModal.paymentMethod === 'cash'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : 'border-gray-300 hover:border-gray-400'
                                }`}
                            >
                                💵 Cash
                            </button>
                        </div>
                    </div>

                    <div className="border-t pt-4">
                        <div className="flex justify-between items-center text-lg font-bold">
                            <span>Total:</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={onAddToCart}
                            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Add to Cart
                        </button>
                        <button
                            onClick={onBuyNow}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellModal;
