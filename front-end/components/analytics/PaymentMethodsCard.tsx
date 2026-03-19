import { asMoney } from './analyticsHelpers';

type PaymentBreakdown = {
    buyPrice: string | number;
    sellPrice: string | number;
    profit: string | number;
};

type PaymentMethodsCardProps = {
    cash: PaymentBreakdown;
    nonCash: PaymentBreakdown;
};

export default function PaymentMethodsCard({ cash, nonCash }: PaymentMethodsCardProps) {
    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
            <div className="space-y-3">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">💵 Cash</span>
                        <span className="text-2xl font-bold text-green-700">
                            €{asMoney(cash.profit)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-600">
                        Revenue: €{asMoney(cash.sellPrice)} • Cost: €{asMoney(cash.buyPrice)}
                    </div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-lg">💳 Card</span>
                        <span className="text-2xl font-bold text-blue-700">
                            €{asMoney(nonCash.profit)}
                        </span>
                    </div>
                    <div className="text-xs text-gray-600">
                        Revenue: €{asMoney(nonCash.sellPrice)} • Cost: €{asMoney(nonCash.buyPrice)}
                    </div>
                </div>
            </div>
        </div>
    );
}
