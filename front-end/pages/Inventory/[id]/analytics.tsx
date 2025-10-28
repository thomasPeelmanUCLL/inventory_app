import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Header from '../../../components/layout/header';
import { getInventoryAnalytics } from '../../../lib/api';
import React from 'react';
import * as XLSX from 'xlsx';

interface AnalyticsData {
    summary: {
        totalBuyPrice: number;
        totalSellPrice: number;
        totalProfit: number;
        totalQuantitySold: number;
        totalTransactions: number;
        cashTransactions: number;
        nonCashTransactions: number;
    };
    topSellingItems: Array<{
        itemId: number;
        itemName: string;
        totalQuantity: number;
        totalBuyPrice: number;
        totalSellPrice: number;
        totalProfit: number;
        priceBreakdown?: Array<{
            sellPrice: number;
            priceVariableName: string | null;
            quantity: number;
            totalBuy: number;
            totalSell: number;
            profit: number;
        }>;
    }>;
    salesByDay: Array<{
        date: string;
        totalBuyPrice: number;
        totalSellPrice: number;
        totalProfit: number;
        totalQuantity: number;
        transactionCount: number;
        itemBreakdown?: Array<{
            itemId: number;
            itemName: string;
            quantity: number;
            buyPrice: number;
            sellPrice: number;
            profit: number;
        }>;
    }>;
    paymentMethodBreakdown: {
        cash: { buyPrice: number; sellPrice: number; profit: number };
        nonCash: { buyPrice: number; sellPrice: number; profit: number };
    };
    priceVariableBreakdown: Array<{
        priceVariableName: string;
        count: number;
        totalBuyPrice: number;
        totalSellPrice: number;
        totalProfit: number;
    }>;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const {id} = router.query;
    const inventoryId = Number(id);

    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
    });

    useEffect(() => {
        if (!router.isReady || !id) return;
        loadAnalytics();
    }, [router.isReady, id, dateRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('📊 Fetching analytics for inventory:', inventoryId);
            console.log('📅 Date range:', dateRange.start.toISOString(), '-', dateRange.end.toISOString());

            const data = await getInventoryAnalytics(inventoryId, dateRange.start, dateRange.end);

            console.log('✅ Analytics data:', data);
            setAnalytics(data);
        } catch (err: any) {
            console.error('❌ Failed to load analytics:', err);
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!analytics) return;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ✅ Summary Sheet
        const summaryData = [
            ['Sales Summary', ''],
            ['Period', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
            ['', ''],
            ['Total Profit', `€${analytics.summary.totalProfit.toFixed(2)}`],
            ['Total Revenue', `€${analytics.summary.totalSellPrice.toFixed(2)}`],
            ['Total Cost', `€${analytics.summary.totalBuyPrice.toFixed(2)}`],
            ['Items Sold', analytics.summary.totalQuantitySold.toString()],
            ['Transactions', analytics.summary.totalTransactions.toString()],
            ['Cash Payments', analytics.summary.cashTransactions.toString()],
            ['Card Payments', analytics.summary.nonCashTransactions.toString()],
        ];
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // ✅ Top Selling Items Sheet
        const itemsData = [
            ['Item Name', 'Quantity Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analytics.topSellingItems.map(item => [
                item.itemName,
                item.totalQuantity.toString(),
                item.totalBuyPrice.toFixed(2),
                item.totalSellPrice.toFixed(2),
                item.totalProfit.toFixed(2)
            ])
        ];
        const wsItems = XLSX.utils.aoa_to_sheet(itemsData);
        XLSX.utils.book_append_sheet(wb, wsItems, 'Top Selling Items');

        // ✅ Sales by Day Sheet
        const dailyData = [
            ['Date', 'Transactions', 'Items Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analytics.salesByDay.map(day => [
                new Date(day.date).toLocaleDateString(),
                day.transactionCount.toString(),
                day.totalQuantity.toString(),
                day.totalBuyPrice.toFixed(2),
                day.totalSellPrice.toFixed(2),
                day.totalProfit.toFixed(2)
            ])
        ];
        const wsDaily = XLSX.utils.aoa_to_sheet(dailyData);
        XLSX.utils.book_append_sheet(wb, wsDaily, 'Sales by Day');

        // ✅ Detailed Sales by Day (with item breakdown)
        const detailedDailyData: any[][] = [
            ['Date', 'Item Name', 'Quantity', 'Buy Price', 'Sell Price', 'Profit']
        ];
        analytics.salesByDay.forEach(day => {
            if (day.itemBreakdown && day.itemBreakdown.length > 0) {
                day.itemBreakdown.forEach(item => {
                    detailedDailyData.push([
                        new Date(day.date).toLocaleDateString(),
                        item.itemName,
                        item.quantity.toString(),
                        item.buyPrice.toFixed(2),
                        item.sellPrice.toFixed(2),
                        item.profit.toFixed(2)
                    ]);
                });
            }
        });
        const wsDetailedDaily = XLSX.utils.aoa_to_sheet(detailedDailyData);
        XLSX.utils.book_append_sheet(wb, wsDetailedDaily, 'Detailed Daily Sales');

        // ✅ Payment Methods Sheet
        const paymentData = [
            ['Payment Method', 'Buy Price', 'Sell Price', 'Profit'],
            ['Cash',
                analytics.paymentMethodBreakdown.cash.buyPrice.toFixed(2),
                analytics.paymentMethodBreakdown.cash.sellPrice.toFixed(2),
                analytics.paymentMethodBreakdown.cash.profit.toFixed(2)
            ],
            ['Card',
                analytics.paymentMethodBreakdown.nonCash.buyPrice.toFixed(2),
                analytics.paymentMethodBreakdown.nonCash.sellPrice.toFixed(2),
                analytics.paymentMethodBreakdown.nonCash.profit.toFixed(2)
            ]
        ];
        const wsPayment = XLSX.utils.aoa_to_sheet(paymentData);
        XLSX.utils.book_append_sheet(wb, wsPayment, 'Payment Methods');

        // ✅ Price Variables Sheet
        if (analytics.priceVariableBreakdown.length > 0) {
            const priceVarData = [
                ['Price Variable', 'Count', 'Buy Price', 'Sell Price', 'Profit'],
                ...analytics.priceVariableBreakdown.map(pv => [
                    pv.priceVariableName,
                    pv.count.toString(),
                    pv.totalBuyPrice.toFixed(2),
                    pv.totalSellPrice.toFixed(2),
                    pv.totalProfit.toFixed(2)
                ])
            ];
            const wsPriceVar = XLSX.utils.aoa_to_sheet(priceVarData);
            XLSX.utils.book_append_sheet(wb, wsPriceVar, 'Price Variables');
        }

        // Generate filename with date range
        const filename = `Sales_Analytics_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end.toISOString().split('T')[0]}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    };

    const toggleItemExpansion = (itemId: number) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemId)) {
                newSet.delete(itemId);
            } else {
                newSet.add(itemId);
            }
            return newSet;
        });
    };

    const toggleDayExpansion = (date: string) => {
        setExpandedDays(prev => {
            const newSet = new Set(prev);
            if (newSet.has(date)) {
                newSet.delete(date);
            } else {
                newSet.add(date);
            }
            return newSet;
        });
    };

    if (!router.isReady || !id) {
        return (
            <>
                <Header/>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-lg">Initializing...</div>
                </div>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header/>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-lg">Loading analytics...</div>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header/>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-600 text-xl mb-4">Error loading analytics</div>
                        <div className="text-gray-600 mb-4">{error}</div>
                        <button
                            onClick={() => loadAnalytics()}
                            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (!analytics) {
        return (
            <>
                <Header/>
                <div className="min-h-screen flex items-center justify-center">
                    <div className="text-lg">No data available</div>
                </div>
            </>
        );
    }

    return (
        <>
            <Header/>
            <div className="container mx-auto p-6 space-y-6">
                {/* Header with Date Range */}
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold">Sales Analytics</h1>

                    <div className="flex gap-4 items-center">
                        <div className="flex gap-2 items-center">
                            <label className="text-sm font-medium">From:</label>
                            <input
                                type="date"
                                value={dateRange.start.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange({...dateRange, start: new Date(e.target.value)})}
                                className="border rounded px-3 py-2"
                            />
                            <label className="text-sm font-medium">To:</label>
                            <input
                                type="date"
                                value={dateRange.end.toISOString().split('T')[0]}
                                onChange={(e) => setDateRange({...dateRange, end: new Date(e.target.value)})}
                                className="border rounded px-3 py-2"
                            />
                        </div>

                        {/* ✅ Export Button */}
                        <button
                            onClick={exportToExcel}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                            <span>📊</span> Export to Excel
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow border border-green-200">
                        <p className="text-sm text-gray-600 mb-1">Total Profit</p>
                        <p className="text-3xl font-bold text-green-700">
                            €{analytics.summary.totalProfit.toFixed(2)}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <p className="text-sm text-gray-500 mb-1">Items Sold</p>
                        <p className="text-3xl font-bold">{analytics.summary.totalQuantitySold}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <p className="text-sm text-gray-500 mb-1">Transactions</p>
                        <p className="text-3xl font-bold">{analytics.summary.totalTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <p className="text-sm text-gray-500 mb-1">Cash Payments</p>
                        <p className="text-3xl font-bold text-green-600">{analytics.summary.cashTransactions}</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <p className="text-sm text-gray-500 mb-1">Card Payments</p>
                        <p className="text-3xl font-bold text-blue-600">{analytics.summary.nonCashTransactions}</p>
                    </div>
                </div>

                {/* Top Selling Items */}
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
                            {analytics.topSellingItems.map((item) => {
                                const isExpanded = expandedItems.has(item.itemId);
                                return (
                                    <React.Fragment key={item.itemId}>
                                        <tr
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleItemExpansion(item.itemId)}
                                        >
                                            <td className="py-3 px-4 text-gray-400">
                                                {isExpanded ? '▼' : '▶'}
                                            </td>
                                            <td className="py-3 px-4 font-medium">{item.itemName}</td>
                                            <td className="text-center px-4">{item.totalQuantity}</td>
                                            <td className="text-right px-4">
                                                <div className="text-green-700 font-bold">€{item.totalProfit.toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">
                                                    €{item.totalSellPrice.toFixed(2)} - €{item.totalBuyPrice.toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && item.priceBreakdown && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={4} className="px-4 py-2">
                                                    <div className="ml-8 space-y-2">
                                                        <div className="text-sm font-semibold text-gray-700 mb-2">Sales by Price:</div>
                                                        {item.priceBreakdown.map((priceDetail: any, idx: number) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                                                                <div>
                                                                    <span className="font-medium">{priceDetail.quantity}x</span>
                                                                    <span className="text-gray-600 ml-2">at €{priceDetail.sellPrice.toFixed(2)}</span>
                                                                    {priceDetail.priceVariableName && (
                                                                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                                                            {priceDetail.priceVariableName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-green-700">€{priceDetail.profit.toFixed(2)}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        €{priceDetail.totalSell.toFixed(2)} - €{priceDetail.totalBuy.toFixed(2)}
                                                                    </div>
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
                            {analytics.topSellingItems.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-gray-500">No items sold yet</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sales by Day */}
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
                            {analytics.salesByDay.map((day) => {
                                const isExpanded = expandedDays.has(day.date);
                                return (
                                    <React.Fragment key={day.date}>
                                        <tr
                                            className="border-b hover:bg-gray-50 cursor-pointer"
                                            onClick={() => toggleDayExpansion(day.date)}
                                        >
                                            <td className="py-3 px-4 text-gray-400">
                                                {isExpanded ? '▼' : '▶'}
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                {new Date(day.date).toLocaleDateString()}
                                            </td>
                                            <td className="text-center px-4">{day.transactionCount}</td>
                                            <td className="text-center px-4">{day.totalQuantity}</td>
                                            <td className="text-right px-4">
                                                <div className="text-green-700 font-bold">€{day.totalProfit.toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">
                                                    €{day.totalSellPrice.toFixed(2)} - €{day.totalBuyPrice.toFixed(2)}
                                                </div>
                                            </td>
                                        </tr>
                                        {isExpanded && day.itemBreakdown && (
                                            <tr className="bg-gray-50">
                                                <td colSpan={5} className="px-4 py-2">
                                                    <div className="ml-8 space-y-2">
                                                        <div className="text-sm font-semibold text-gray-700 mb-2">Items Sold:</div>
                                                        {day.itemBreakdown.map((itemDetail, idx) => (
                                                            <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border text-sm">
                                                                <div>
                                                                    <span className="font-medium">{itemDetail.itemName}</span>
                                                                    <span className="text-gray-600 ml-2">× {itemDetail.quantity}</span>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="font-bold text-green-700">€{itemDetail.profit.toFixed(2)}</div>
                                                                    <div className="text-xs text-gray-500">
                                                                        €{itemDetail.sellPrice.toFixed(2)} - €{itemDetail.buyPrice.toFixed(2)}
                                                                    </div>
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

                {/* Payment Methods & Price Variables */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Methods */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h2 className="text-xl font-bold mb-4">Payment Methods</h2>
                        <div className="space-y-3">
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">💵 Cash</span>
                                    <span className="text-2xl font-bold text-green-700">
                                    €{analytics.paymentMethodBreakdown.cash.profit.toFixed(2)}
                                </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Revenue: €{analytics.paymentMethodBreakdown.cash.sellPrice.toFixed(2)} •
                                    Cost: €{analytics.paymentMethodBreakdown.cash.buyPrice.toFixed(2)}
                                </div>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-lg">💳 Card</span>
                                    <span className="text-2xl font-bold text-blue-700">
                                    €{analytics.paymentMethodBreakdown.nonCash.profit.toFixed(2)}
                                </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                    Revenue: €{analytics.paymentMethodBreakdown.nonCash.sellPrice.toFixed(2)} •
                                    Cost: €{analytics.paymentMethodBreakdown.nonCash.buyPrice.toFixed(2)}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Price Variables */}
                    <div className="bg-white p-6 rounded-lg shadow border">
                        <h2 className="text-xl font-bold mb-4">Price Variables Used</h2>
                        <div className="space-y-3">
                            {analytics.priceVariableBreakdown.map((pv) => (
                                <div key={pv.priceVariableName} className="p-4 bg-gray-50 rounded-lg border">
                                    <div className="flex justify-between items-center mb-2">
                                        <div>
                                            <div className="font-bold">{pv.priceVariableName}</div>
                                            <div className="text-xs text-gray-500">{pv.count} sales</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-green-700">
                                                €{pv.totalProfit.toFixed(2)}
                                            </div>
                                            <div className="text-xs text-gray-600">
                                                €{pv.totalSellPrice.toFixed(2)} - €{pv.totalBuyPrice.toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Back Button */}
                <div className="flex justify-start">
                    <button
                        onClick={() => router.push(`/Inventory/${inventoryId}`)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        <span>←</span> Back to Inventory
                    </button>
                </div>
            </div>
        </>
    );
}
