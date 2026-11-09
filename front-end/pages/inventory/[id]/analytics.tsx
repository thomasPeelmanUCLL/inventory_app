import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import * as XLSX from 'xlsx';
import Header from '../../../components/layout/Header';
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
import { PaymentBreakdown } from '../../../components/analytics/PaymentMethodsCard';
import { PAYMENT_METHODS, PAYMENT_METHOD_ORDER } from '../../../lib/payment';
import { PaymentMethod } from '@types';

type DateRange = { start: Date; end: Date };

interface AnalyticsData {
    summary: {
        totalBuyPrice: string | number;
        totalSellPrice: string | number;
        totalProfit: string | number;
        totalQuantitySold: number;
        totalTransactions: number;
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
        [method in PaymentMethod]: PaymentBreakdown;
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
    const { id: inventoryIdParam } = router.query;
    const inventoryId = Number(inventoryIdParam);

    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [selectedDateRange, setSelectedDateRange] = useState<DateRange>({
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date(),
    });

    useEffect(() => {
        if (!router.isReady || !inventoryIdParam) return;
        loadAnalyticsData();
    }, [router.isReady, inventoryIdParam, selectedDateRange]);

    const loadAnalyticsData = async () => {
        try {
            setIsLoading(true);
            setLoadError(null);
            const fetchedAnalytics = await getInventoryAnalytics(
                inventoryId,
                selectedDateRange.start,
                selectedDateRange.end,
            );
            setAnalyticsData(fetchedAnalytics);
        } catch (err: any) {
            setLoadError(err.message || 'Failed to load analytics');
        } finally {
            setIsLoading(false);
        }
    };

    const exportToExcel = () => {
        if (!analyticsData) return;
        const workbook = XLSX.utils.book_new();

        const summaryRows = [
            ['Sales Summary', ''],
            [
                'Period',
                `${selectedDateRange.start.toLocaleDateString()} - ${selectedDateRange.end.toLocaleDateString()}`,
            ],
            ['', ''],
            ['Total Profit', `€${asMoney(analyticsData.summary.totalProfit)}`],
            ['Total Revenue', `€${asMoney(analyticsData.summary.totalSellPrice)}`],
            ['Total Cost', `€${asMoney(analyticsData.summary.totalBuyPrice)}`],
            ['Items Sold', String(analyticsData.summary.totalQuantitySold)],
            ['Transactions', String(analyticsData.summary.totalTransactions)],
            ...PAYMENT_METHOD_ORDER.map((method) => [
                `${PAYMENT_METHODS[method].label} Payments`,
                String(analyticsData.paymentMethodBreakdown[method].transactionCount),
            ]),
        ];
        XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(summaryRows), 'Summary');

        const topItemsRows = [
            ['Item Name', 'Quantity Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analyticsData.topSellingItems.map((topItem) => [
                topItem.itemName,
                String(topItem.totalQuantity),
                asMoney(topItem.totalBuyPrice),
                asMoney(topItem.totalSellPrice),
                asMoney(topItem.totalProfit),
            ]),
        ];
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.aoa_to_sheet(topItemsRows),
            'Top Selling Items',
        );

        const dailySalesRows = [
            ['Date', 'Transactions', 'Items Sold', 'Buy Price', 'Sell Price', 'Profit'],
            ...analyticsData.salesByDay.map((dayEntry) => [
                new Date(dayEntry.date).toLocaleDateString(),
                String(dayEntry.transactionCount),
                String(dayEntry.totalQuantity),
                asMoney(dayEntry.totalBuyPrice),
                asMoney(dayEntry.totalSellPrice),
                asMoney(dayEntry.totalProfit),
            ]),
        ];
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.aoa_to_sheet(dailySalesRows),
            'Sales by Day',
        );

        const detailedSalesRows: any[][] = [
            ['Date', 'Item Name', 'Quantity', 'Buy Price', 'Sell Price', 'Profit'],
        ];
        analyticsData.salesByDay.forEach((dayEntry) => {
            dayEntry.itemBreakdown?.forEach((soldItem) => {
                detailedSalesRows.push([
                    new Date(dayEntry.date).toLocaleDateString(),
                    soldItem.itemName,
                    String(soldItem.quantity),
                    asMoney(soldItem.buyPrice),
                    asMoney(soldItem.sellPrice),
                    asMoney(soldItem.profit),
                ]);
            });
        });
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.aoa_to_sheet(detailedSalesRows),
            'Detailed Daily Sales',
        );

        const paymentMethodRows = [
            ['Payment Method', 'Sales', 'Buy Price', 'Sell Price', 'Profit'],
            ...PAYMENT_METHOD_ORDER.map((method) => {
                const totals = analyticsData.paymentMethodBreakdown[method];
                return [
                    PAYMENT_METHODS[method].label,
                    String(totals.transactionCount),
                    asMoney(totals.buyPrice),
                    asMoney(totals.sellPrice),
                    asMoney(totals.profit),
                ];
            }),
        ];
        XLSX.utils.book_append_sheet(
            workbook,
            XLSX.utils.aoa_to_sheet(paymentMethodRows),
            'Payment Methods',
        );

        if (analyticsData.priceVariableBreakdown.length > 0) {
            const priceVariableRows = [
                ['Price Variable', 'Count', 'Buy Price', 'Sell Price', 'Profit'],
                ...analyticsData.priceVariableBreakdown.map((priceVariableEntry) => [
                    priceVariableEntry.priceVariableName,
                    String(priceVariableEntry.count),
                    asMoney(priceVariableEntry.totalBuyPrice),
                    asMoney(priceVariableEntry.totalSellPrice),
                    asMoney(priceVariableEntry.totalProfit),
                ]),
            ];
            XLSX.utils.book_append_sheet(
                workbook,
                XLSX.utils.aoa_to_sheet(priceVariableRows),
                'Price Variables',
            );
        }

        XLSX.writeFile(
            workbook,
            `Sales_Analytics_${selectedDateRange.start.toISOString().split('T')[0]}_to_${selectedDateRange.end.toISOString().split('T')[0]}.xlsx`,
        );
    };

    if (!router.isReady || !inventoryIdParam)
        return (
            <>
                <Header />
                <LoadingScreen message="Initializing..." />
            </>
        );
    if (isLoading)
        return (
            <>
                <Header />
                <LoadingScreen message="Loading analytics..." />
            </>
        );
    if (loadError)
        return (
            <>
                <Header />
                <ErrorScreen message={loadError} onRetry={loadAnalyticsData} />
            </>
        );
    if (!analyticsData)
        return (
            <>
                <Header />
                <LoadingScreen message="No data available" />
            </>
        );

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 space-y-6">
                <AnalyticsDateBar
                    dateRange={selectedDateRange}
                    onChange={setSelectedDateRange}
                    onExport={exportToExcel}
                />
                <SummaryCards summary={analyticsData.summary} paymentCounts={analyticsData.paymentMethodBreakdown} />
                <TopSellingTable items={analyticsData.topSellingItems} />
                <SalesByDayTable days={analyticsData.salesByDay} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <PaymentMethodsCard breakdown={analyticsData.paymentMethodBreakdown} />
                    <PriceVariablesCard entries={analyticsData.priceVariableBreakdown} />
                </div>
                <div className="flex justify-start">
                    <button
                        onClick={() => router.push(`/inventory/${inventoryId}`)}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    >
                        ← Back to Inventory
                    </button>
                </div>
            </div>
        </>
    );
}
