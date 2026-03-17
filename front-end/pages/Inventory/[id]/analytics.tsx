import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import Header from '../../../components/layout/header';
import LoadingScreen from '../../../components/common/LoadingScreen';
import ErrorScreen from '../../../components/common/ErrorScreen';
import AnalyticsDateBar from '../../../components/analytics/AnalyticsDateBar';
import SummaryCards from '../../../components/analytics/SummaryCards';
import TopSellingTable from '../../../components/analytics/TopSellingTable';
import SalesByDayTable from '../../../components/analytics/SalesByDayTable';
import PaymentMethodsCard from '../../../components/analytics/PaymentMethodsCard';
import PriceVariablesCard from '../../../components/analytics/PriceVariablesCard';
import { getInventoryAnalytics } from '../../../lib/api';
import { asMoney } from '../../../components/analytics/analyticsHelpers';

type DateRange = { start: Date; end: Date };

interface AnalyticsData {
    summary: {
        totalBuyPrice: string | number;
        totalSellPrice: string | number;
        totalProfit: string | number;
        totalQuantitySold: number;
        totalTransactions: number;
        cashTransactions: number;
        nonCashTransactions: number;
    };
    topSellingItems: Array<{
        itemId: number;
        itemName: string;
        totalQuantity: number;
        totalBuyPrice: string | number;
        totalSellPrice: string | number;
        totalProfit: string | number;
        priceBreakdown?: Array<{
            sellPrice: string | number;
            priceVariableName: string | null;
            quantity: number;
            totalBuy: string | number;
            totalSell: string | number;
            profit: string | number;
        }>;
    }>;
    salesByDay: Array<{
        date: string;
        totalBuyPrice: string | number;
        totalSellPrice: string | number;
        totalProfit: string | number;
        totalQuantity: number;
        transactionCount: number;
        itemBreakdown?: Array<{
            itemId: number;
            itemName: string;
            quantity: number;
            buyPrice: string | number;
            sellPrice: string | number;
            profit: string | number;
        }>;
    }>;
    paymentMethodBreakdown: {
        cash: { buyPrice: string | number; sellPrice: string | number; profit: string | number };
        nonCash: { buyPrice: string | number; sellPrice: string | number; profit: string | number };
    };
    priceVariableBreakdown: Array<{
        priceVariableName: string;
        count: number;
        totalBuyPrice: string | number;
        totalSellPrice: string | number;
        totalProfit: string | number;
    }>;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const { id } = router.query;
    const inventoryId = Number(id);

    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
    });

    useEffect(() => {
        if (!router.isReady || !id) return;
        loadAnalytics();
    }, [router.isReady, id, dateRange]);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getInventoryAnalytics(inventoryId, dateRange.start, dateRange.end);
            setAnalytics(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!analytics) return;
        const wb = XLSX.utils.book_new();

        const summaryData = [
            ['Sales Summary', ''],
            ['Period', `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`],
            ['', ''],
            ['Total Profit', `€${asMoney(analytics.summary.totalProfit)}`],
            ['Total Revenue', `€${asMoney(analytics.summary.totalSellPrice)}`],
            ['Total Cost', `€${asMoney(analytics.summary.totalBuyPrice)}`],
            ['Items Sold', String(analytics.summary.totalQuantitySold)],
            ['Transactions', String(analytics.summary.totalTransactions)],
            ['Cash Payments', String(analytics.summary.cashTransactions)],
            ['Card Payments', String(analytics.summary.nonCashTransactions)],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), 'Summary');

        const itemsData = [
            ['Item Name', 'Quantity Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analytics.topSellingItems.map(item => [item.itemName, String(item.totalQuantity), asMoney(item.totalBuyPrice), asMoney(item.totalSellPrice), asMoney(item.totalProfit)])
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(itemsData), 'Top Selling Items');

        const dailyData = [
            ['Date', 'Transactions', 'Items Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analytics.salesByDay.map(day => [new Date(day.date).toLocaleDateString(), String(day.transactionCount), String(day.totalQuantity), asMoney(day.totalBuyPrice), asMoney(day.totalSellPrice), asMoney(day.totalProfit)])
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(dailyData), 'Sales by Day');

        const detailedData: any[][] = [['Date', 'Item Name', 'Quantity', 'Buy Price', 'Sell Price', 'Profit']];
        analytics.salesByDay.forEach(day => {
            day.itemBreakdown?.forEach(item => {
                detailedData.push([new Date(day.date).toLocaleDateString(), item.itemName, String(item.quantity), asMoney(item.buyPrice), asMoney(item.sellPrice), asMoney(item.profit)]);
            });
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailedData), 'Detailed Daily Sales');

        const paymentData = [
            ['Payment Method', 'Buy Price', 'Sell Price', 'Profit'],
            ['Cash', asMoney(analytics.paymentMethodBreakdown.cash.buyPrice), asMoney(analytics.paymentMethodBreakdown.cash.sellPrice), asMoney(analytics.paymentMethodBreakdown.cash.profit)],
            ['Card', asMoney(analytics.paymentMethodBreakdown.nonCash.buyPrice), asMoney(analytics.paymentMethodBreakdown.nonCash.sellPrice), asMoney(analytics.paymentMethodBreakdown.nonCash.profit)],
        ];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(paymentData), 'Payment Methods');

        if (analytics.priceVariableBreakdown.length > 0) {
            const pvData = [
                ['Price Variable', 'Count', 'Buy Price', 'Sell Price', 'Profit'],
                ...analytics.priceVariableBreakdown.map(pv => [pv.priceVariableName, String(pv.count), asMoney(pv.totalBuyPrice), asMoney(pv.totalSellPrice), asMoney(pv.totalProfit)])
            ];
            XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(pvData), 'Price Variables');
        }

        XLSX.writeFile(wb, `Sales_Analytics_${dateRange.start.toISOString().split('T')[0]}_to_${dateRange.end.toISOString().split('T')[0]}.xlsx`);
    };

    if (!router.isReady || !id) return (<><Header /><LoadingScreen message="Initializing..." /></>);
    if (loading) return (<><Header /><LoadingScreen message="Loading analytics..." /></>);
    if (error) return (<><Header /><ErrorScreen message={error} onRetry={loadAnalytics} /></>);
    if (!analytics) return (<><Header /><LoadingScreen message="No data available" /></>);

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 space-y-6">
                <AnalyticsDateBar dateRange={dateRange} onChange={setDateRange} onExport={exportToExcel} />
                <SummaryCards summary={analytics.summary} />
                <TopSellingTable items={analytics.topSellingItems} />
                <SalesByDayTable days={analytics.salesByDay} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PaymentMethodsCard
                        cash={analytics.paymentMethodBreakdown.cash}
                        nonCash={analytics.paymentMethodBreakdown.nonCash}
                    />
                    <PriceVariablesCard entries={analytics.priceVariableBreakdown} />
                </div>
                <div className="flex justify-start">
                    <button
                        onClick={() => router.push(`/Inventory/${inventoryId}`)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        ← Back to Inventory
                    </button>
                </div>
            </div>
        </>
    );
}
