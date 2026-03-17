import { asMoney } from './analyticsHelpers';

type Summary = {
    totalProfit: string | number;
    totalQuantitySold: number;
    totalTransactions: number;
    cashTransactions: number;
    nonCashTransactions: number;
};

export default function SummaryCards({ summary }: { summary: Summary }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="bg-white p-6 rounded-lg shadow border">
                <p className="text-sm text-gray-500 mb-1">Cash Payments</p>
                <p className="text-3xl font-bold text-green-600">{summary.cashTransactions}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border">
                <p className="text-sm text-gray-500 mb-1">Card Payments</p>
                <p className="text-3xl font-bold text-blue-600">{summary.nonCashTransactions}</p>
            </div>
        </div>
    );
}
