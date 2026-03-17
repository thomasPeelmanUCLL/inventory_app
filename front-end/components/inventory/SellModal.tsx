import { useState, useEffect } from 'react';
import { SellModalData, PriceVariable } from '@types';

type Props = {
    sellModal: SellModalData;
    priceVariables: PriceVariable[];
    onClose: () => void;
    onAddToCart: () => void;
    onBuyNow: () => void;
    onChange: (updatedSaleData: SellModalData) => void;
};

const SellModal = ({ sellModal, priceVariables, onClose, onAddToCart, onBuyNow, onChange }: Props) => {
    const [selectedPriceVariableName, setSelectedPriceVariableName] = useState('');
    const [customPriceInput, setCustomPriceInput] = useState('');

    useEffect(() => {
        const defaultPriceVariable = priceVariables.find(priceVariable => priceVariable.isDefault);
        if (defaultPriceVariable && !selectedPriceVariableName && !customPriceInput) {
            handlePriceVariableChange(defaultPriceVariable.name);
        }
    }, [priceVariables]);

    const handleQuantityChange = (newQuantity: number) => {
        onChange({ ...sellModal, quantity: newQuantity });
    };

    const handlePriceVariableChange = (variableName: string) => {
        setSelectedPriceVariableName(variableName);
        setCustomPriceInput('');

        if (variableName === '') {
            onChange({
                ...sellModal,
                finalSellPrice: sellModal.item.buyPrice,
                priceVariableName: undefined,
                isCustomPrice: false,
            });
        } else {
            const matchedPriceVariable = priceVariables.find(priceVariable => priceVariable.name === variableName);
            let calculatedPrice = sellModal.item.buyPrice;

            if (matchedPriceVariable) {
                if (matchedPriceVariable.type === 'PERCENTAGE') {
                    calculatedPrice = sellModal.item.buyPrice * (1 + matchedPriceVariable.value / 100);
                } else if (matchedPriceVariable.type === 'FIXED') {
                    calculatedPrice = matchedPriceVariable.value;
                }
            }

            onChange({
                ...sellModal,
                finalSellPrice: calculatedPrice,
                priceVariableName: variableName,
                isCustomPrice: false,
            });
        }
    };

    const handleCustomPriceChange = (rawInput: string) => {
        setCustomPriceInput(rawInput);
        setSelectedPriceVariableName('Custom');
        const parsedPrice = parseFloat(rawInput);
        if (!isNaN(parsedPrice) && parsedPrice > 0) {
            onChange({
                ...sellModal,
                finalSellPrice: parsedPrice,
                priceVariableName: 'Custom',
                isCustomPrice: true,
            });
        }
    };

    const handlePaymentMethodChange = (paymentMethod: 'cash' | 'card') => {
        onChange({ ...sellModal, paymentMethod });
    };

    const totalSalePrice = sellModal.finalSellPrice * sellModal.quantity;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{sellModal.item.name}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-4">
                    <div>
                        <p className="text-gray-600">{sellModal.item.description}</p>
                        <p className="text-sm text-gray-500">Available: {sellModal.item.quantity}</p>
                        <p className="text-sm text-gray-500">Base Price: €{Number(sellModal.item.buyPrice).toFixed(2)}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                        <input
                            type="number" min="1" max={sellModal.item.quantity}
                            value={sellModal.quantity}
                            onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {priceVariables.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Price Variable</label>
                            <select
                                value={selectedPriceVariableName === 'Custom' ? '' : selectedPriceVariableName}
                                onChange={(e) => handlePriceVariableChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Base Price</option>
                                {priceVariables.map((priceVariable) => (
                                    <option key={priceVariable.id} value={priceVariable.name}>{priceVariable.name}</option>
                                ))}
                                <option value="Custom">Custom</option>
                            </select>
                        </div>
                    )}

                    {selectedPriceVariableName === 'Custom' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Sell Price</label>
                            <div className="relative">
                                <span className="absolute left-3 top-2 text-gray-500">€</span>
                                <input
                                    type="number" step="0.01" min="0"
                                    value={customPriceInput}
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
                            <span>€{totalSalePrice.toFixed(2)}</span>
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
