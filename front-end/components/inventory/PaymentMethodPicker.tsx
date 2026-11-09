import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../../lib/payment';
import { PaymentMethod } from '@types';

type Props = {
    value: PaymentMethod;
    onChange: (paymentMethod: PaymentMethod) => void;
};

/** Cash / Card / Drinking card toggle, shared by the sell popup and the cart. */
export default function PaymentMethodPicker({ value, onChange }: Props) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
                {PAYMENT_METHOD_ORDER.map((method) => {
                    const { label, emoji, selected } = PAYMENT_METHODS[method];
                    return (
                        <button
                            key={method}
                            type="button"
                            onClick={() => onChange(method)}
                            aria-pressed={value === method}
                            className={`py-2 px-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                                value === method ? selected : 'border-gray-300 hover:border-gray-400'
                            }`}
                        >
                            {emoji} {label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
