type HistoryStatsCardsProps = {
    totalRevenue: number;
    totalItems: number;
    totalTransactions: number;
};

export default function HistoryStatsCards({
    totalRevenue,
    totalItems,
    totalTransactions,
}: HistoryStatsCardsProps) {
    return (
        <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Total Revenue</h3>
                <p className="text-3xl font-bold text-green-600 mt-2">${totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Items Sold</h3>
                <p className="text-3xl font-bold text-blue-600 mt-2">{totalItems}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-500 text-sm font-medium">Transactions</h3>
                <p className="text-3xl font-bold text-purple-600 mt-2">{totalTransactions}</p>
            </div>
        </div>
    );
}
