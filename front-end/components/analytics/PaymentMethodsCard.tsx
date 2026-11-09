import { asMoney } from './analyticsHelpers';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../../lib/payment';
import { PaymentMethod } from '@types';

export type PaymentBreakdown = {
    buyPrice: string | number;
    sellPrice: string | number;
    profit: string | number;
    transactionCount: number;
};

type PaymentMethodsCardProps = {
    breakdown: Record<PaymentMethod, PaymentBreakdown>;
};

export default function PaymentMethodsCard({ breakdown }: PaymentMethodsCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
            <div className="space-y-3">
                {PAYMENT_METHOD_ORDER.map((method) => {
                    const { label, emoji, card, amount } = PAYMENT_METHODS[method];
                    const totals = breakdown[method];
                    return (
                        <div key={method} className={`p-4 rounded-lg border ${card}`}>
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-lg">
                                    {emoji} {label}
                                </span>
                                <span className={`text-2xl font-bold ${amount}`}>€{asMoney(totals.profit)}</span>
                            </div>
                            <div className="text-xs text-gray-600">
                                {totals.transactionCount} sale(s) • Revenue: €{asMoney(totals.sellPrice)} • Cost: €
                                {asMoney(totals.buyPrice)}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
