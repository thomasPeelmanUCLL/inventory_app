import { asMoney } from './analyticsHelpers';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../../lib/payment';
import { PaymentMethod } from '@types';

type Summary = {
    totalProfit: string | number;
    totalQuantitySold: number;
    totalTransactions: number;
};

type Props = {
    summary: Summary;
    paymentCounts: Record<PaymentMethod, { transactionCount: number }>;
};

export default function SummaryCards({ summary, paymentCounts }: Props) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Total Profit</p>
                <p className="text-3xl font-bold text-green-700">€{asMoney(summary.totalProfit)}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
                <p className="text-sm text-gray-500 mb-1">Items Sold</p>
                <p className="text-3xl font-bold">{summary.totalQuantitySold}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
                <p className="text-sm text-gray-500 mb-1">Transactions</p>
                <p className="text-3xl font-bold">{summary.totalTransactions}</p>
            </div>
            {PAYMENT_METHOD_ORDER.map((method) => (
                <div key={method} className="bg-white p-6 rounded-lg shadow border">
                    <p className="text-sm text-gray-500 mb-1">{PAYMENT_METHODS[method].label} Payments</p>
                    <p className={`text-3xl font-bold ${PAYMENT_METHODS[method].amount}`}>
                        {paymentCounts[method].transactionCount}
                    </p>
                </div>
            ))}
        </div>
    );
}
