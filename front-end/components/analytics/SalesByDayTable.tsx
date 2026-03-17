import React, { useState } from 'react';
import { asMoney } from './analyticsHelpers';

type ItemBreakdown = {
    itemId: number;
    itemName: string;
    quantity: number;
    buyPrice: string | number;
    sellPrice: string | number;
    profit: string | number;
};

type DaySale = {
    date: string;
    totalBuyPrice: string | number;
    totalSellPrice: string | number;
    totalProfit: string | number;
    totalQuantity: number;
    transactionCount: number;
    itemBreakdown?: ItemBreakdown[];
};

export default function SalesByDayTable({ days }: { days: DaySale[] }) {
    const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

    const toggleDayExpanded = (date: string) =>
        setExpandedDates(prev => {
            const updatedSet = new Set(prev);
            updatedSet.has(date) ? updatedSet.delete(date) : updatedSet.add(date);
            return updatedSet;
        });

    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Sales by Day</h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2 px-4 font-semibold w-8"></th>
                            <th className="text-left py-2 px-4 font-semibold">Date</th>
                            <th className="text-center py-2 px-4 font-semibold">Trans.</th>
                            <th className="text-center py-2 px-4 font-semibold">Items</th>
                            <th className="text-right py-2 px-4 font-semibold text-green-700">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {days.map((daySale) => {
                            const isExpanded = expandedDates.has(daySale.date);
                            return (
                                <React.Fragment key={daySale.date}>
                                    <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleDayExpanded(daySale.date)}>
                                        <td className="py-3 px-4 text-gray-400">{isExpanded ? '▼' : '▶'}</td>
                                        <td className="py-3 px-4 font-medium">{new Date(daySale.date).toLocaleDateString()}</td>
                                        <td className="text-center px-4">{daySale.transactionCount}</td>
                                        <td className="text-center px-4">{daySale.totalQuantity}</td>
                                        <td className="text-right px-4">
                                            <div className="text-green-700 font-bold">€{asMoney(daySale.totalProfit)}</div>
                                            <div className="text-xs text-gray-500">€{asMoney(daySale.totalSellPrice)} - €{asMoney(daySale.totalBuyPrice)}</div>
                                        </td>
                                    </tr>
                                    {isExpanded && daySale.itemBreakdown && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={5} className="px-4 py-2">
                                                <div className="ml-8 space-y-2">
                                                    <div className="text-sm font-semibold text-gray-700 mb-2">Items Sold:</div>
                                                    {daySale.itemBreakdown.map((soldItem, entryIndex) => (
                                                        <div key={entryIndex} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                                                            <div>
                                                                <span className="font-medium">{soldItem.itemName}</span>
                                                                <span className="text-gray-600 ml-2">× {soldItem.quantity}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-green-700">€{asMoney(soldItem.profit)}</div>
                                                                <div className="text-xs text-gray-500">€{asMoney(soldItem.sellPrice)} - €{asMoney(soldItem.buyPrice)}</div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
