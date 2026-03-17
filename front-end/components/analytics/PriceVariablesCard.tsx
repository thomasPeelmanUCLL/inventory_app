import { asMoney } from './analyticsHelpers';

type PVEntry = {
    priceVariableName: string;
    count: number;
    totalBuyPrice: string | number;
    totalSellPrice: string | number;
    totalProfit: string | number;
};

export default function PriceVariablesCard({ entries }: { entries: PVEntry[] }) {
    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Price Variables Used</h2>
            <div className="space-y-3">
                {entries.map((pv) => (
                    <div key={pv.priceVariableName} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <div className="font-bold">{pv.priceVariableName}</div>
                                <div className="text-xs text-gray-500">{pv.count} sales</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-green-700">€{asMoney(pv.totalProfit)}</div>
                                <div className="text-xs text-gray-600">€{asMoney(pv.totalSellPrice)} - €{asMoney(pv.totalBuyPrice)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
