import { SoldItem } from '@types';

type SalesHistoryTableProps = {
    sales: SoldItem[];
    canEdit: boolean;
    revertingId: number | null;
    onRevert: (id: number) => void;
};

function formatDate(date: Date): string {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function SalesHistoryTable({
    sales,
    canEdit,
    revertingId,
    onRevert,
}: SalesHistoryTableProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold">Sales History</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            {[
                                'Date & Time',
                                'Item',
                                'Quantity',
                                'Price Each',
                                'Price Type',
                                'Total',
                                'Payment',
                                ...(canEdit ? ['Actions'] : []),
                            ].map((h) => (
                                <th
                                    key={h}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sales.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={canEdit ? 8 : 7}
                                    className="px-6 py-12 text-center text-gray-500"
                                >
                                    No sales recorded yet.
                                </td>
                            </tr>
                        ) : (
                            sales.map((sale) => (
                                <tr key={sale.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {formatDate(sale.soldAt)}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {sale.item ? sale.item.name : 'Unknown Item'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {sale.quantity}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                                        ${Number(sale.finalSellPrice).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {sale.isCustomPrice ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                Custom
                                            </span>
                                        ) : sale.priceVariableName ? (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {sale.priceVariableName}
                                            </span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                Base
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
                                        ${(sale.finalSellPrice * sale.quantity).toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                sale.payedCash
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-blue-100 text-blue-800'
                                            }`}
                                        >
                                            {sale.payedCash ? 'Cash' : 'Card'}
                                        </span>
                                    </td>
                                    {canEdit && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <button
                                                onClick={() => sale.id && onRevert(sale.id)}
                                                disabled={revertingId === sale.id}
                                                className={`px-3 py-1 rounded text-white font-medium ${
                                                    revertingId === sale.id
                                                        ? 'bg-gray-400 cursor-not-allowed'
                                                        : 'bg-red-600 hover:bg-red-700'
                                                }`}
                                            >
                                                {revertingId === sale.id
                                                    ? 'Reverting...'
                                                    : 'Revert'}
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
