import React, { useState } from 'react';
import { asMoney } from './analyticsHelpers';

type PriceBreakdown = {
    sellPrice: string | number;
    priceVariableName: string | null;
    quantity: number;
    totalBuy: string | number;
    totalSell: string | number;
    profit: string | number;
};

type TopItem = {
    itemId: number;
    itemName: string;
    totalQuantity: number;
    totalBuyPrice: string | number;
    totalSellPrice: string | number;
    totalProfit: string | number;
    priceBreakdown?: PriceBreakdown[];
};

export default function TopSellingTable({ items }: { items: TopItem[] }) {
    const [expandedItemIds, setExpandedItemIds] = useState<Set<number>>(new Set());

    const toggleItemExpanded = (itemId: number) =>
        setExpandedItemIds(prev => {
            const updatedSet = new Set(prev);
            updatedSet.has(itemId) ? updatedSet.delete(itemId) : updatedSet.add(itemId);
            return updatedSet;
        });

    return (
        <div className="bg-white p-6 rounded-lg shadow border">
            <h2 className="text-xl font-bold mb-4">Top Selling Items</h2>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b">
                            <th className="text-left py-2 px-4 font-semibold w-8"></th>
                            <th className="text-left py-2 px-4 font-semibold">Item</th>
                            <th className="text-center py-2 px-4 font-semibold">Qty</th>
                            <th className="text-right py-2 px-4 font-semibold text-green-700">Profit</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-8 text-gray-500">No items sold yet</td></tr>
                        )}
                        {items.map((topItem) => {
                            const isExpanded = expandedItemIds.has(topItem.itemId);
                            return (
                                <React.Fragment key={topItem.itemId}>
                                    <tr className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => toggleItemExpanded(topItem.itemId)}>
                                        <td className="py-3 px-4 text-gray-400">{isExpanded ? '▼' : '▶'}</td>
                                        <td className="py-3 px-4 font-medium">{topItem.itemName}</td>
                                        <td className="text-center px-4">{topItem.totalQuantity}</td>
                                        <td className="text-right px-4">
                                            <div className="text-green-700 font-bold">€{asMoney(topItem.totalProfit)}</div>
                                            <div className="text-xs text-gray-500">€{asMoney(topItem.totalSellPrice)} - €{asMoney(topItem.totalBuyPrice)}</div>
                                        </td>
                                    </tr>
                                    {isExpanded && topItem.priceBreakdown && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={4} className="px-4 py-2">
                                                <div className="ml-8 space-y-2">
                                                    <div className="text-sm font-semibold text-gray-700 mb-2">Sales by Price:</div>
                                                    {topItem.priceBreakdown.map((priceBreakdownEntry, entryIndex) => (
                                                        <div key={entryIndex} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                                                            <div>
                                                                <span className="font-medium">{priceBreakdownEntry.quantity}x</span>
                                                                <span className="text-gray-600 ml-2">at €{asMoney(priceBreakdownEntry.sellPrice)}</span>
                                                                {priceBreakdownEntry.priceVariableName && (
                                                                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{priceBreakdownEntry.priceVariableName}</span>
                                                                )}
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="font-bold text-green-700">€{asMoney(priceBreakdownEntry.profit)}</div>
                                                                <div className="text-xs text-gray-500">€{asMoney(priceBreakdownEntry.totalSell)} - €{asMoney(priceBreakdownEntry.totalBuy)}</div>
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
