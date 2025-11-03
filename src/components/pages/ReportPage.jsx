import React, { useState, useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { DayPicker } from 'react-day-picker';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
} from 'date-fns';
import { Button } from '../ui';

const SalesReportDisplay = ({ title, totalSales, salesList }) => {
    const formatCurrency = (amount) => {
        // Handle non-numeric values that might come through
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numericAmount)) {
            return amount; // Return 'N/A' or other strings as-is
        }
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(numericAmount);
    };

    return (
        <div className="flex-grow">
            <h2 className="text-xl font-semibold mb-3">{title}</h2>
            <div className="bg-white p-4 rounded-lg shadow-md mb-4 border">
                <p className="text-sm text-gray-600">Total Sales for Period</p>
                <p className="text-3xl font-bold">
                    {formatCurrency(totalSales)}
                </p>
            </div>
            <h3 className="text-lg font-semibold mb-2">
                Sales in Period ({salesList.length})
            </h3>
            <div className="bg-white rounded-lg shadow-md border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {/* --- HEADERS --- */}
                        <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date & Time</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customer</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Staff</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Item(s)</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Price(s)</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quantity</th>
                            <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Total Amount</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Payment Method</th>
                            <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                        </tr>
                        </thead>
                        {/* --- FIXED DATA ORDER --- */}
                        <tbody className="divide-y divide-gray-200">
                        {salesList.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center p-4 text-gray-500">
                                    No sales found for this period.
                                </td>
                            </tr>
                        ) : (
                            salesList.map(sale => (
                                <tr key={sale.id}>
                                    {/* 1. Date & Time */}
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                                    </td>
                                    {/* 2. Customer */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.customerName}</td>
                                    {/* 3. Staff */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.staffName || 'N/A'}</td>
                                    {/* 4. Item(s) */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.productName}</td>
                                    {/* 5. Price(s) */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.price}</td>
                                    {/* 6. Quantity */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.quantity}</td>
                                    {/* 7. Total Amount */}
                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                        {formatCurrency(sale.totalAmount)}
                                    </td>
                                    {/* 8. Payment Method */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.paymentMethod}</td>
                                    {/* 9. Status */}
                                    <td className="px-4 py-2 whitespace-nowrap">{sale.status}</td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ReportPage = () => {
    const { data: salesData, isLoading, error } = useSales();
    const [reportType, setReportType] = useState('weekly');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Helper function for currency formatting, to be used in useMemo
    const formatCurrency = (amount) => {
        const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        if (isNaN(numericAmount)) {
            return amount;
        }
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(numericAmount);
    };

    const reportData = useMemo(() => {
        if (!salesData) {
            return { reportTitle: 'Loading...', totalSales: 0, filteredSales: [] };
        }

        let interval;
        let title;
        const date = selectedDate || new Date();

        if (reportType === 'daily') {
            const start = new Date(date.setHours(0, 0, 0, 0));
            const end = new Date(date.setHours(23, 59, 59, 999));
            interval = { start, end };
            title = `Sales Report: ${format(start, 'MMM d, yyyy')}`;
        } else if (reportType === 'weekly') {
            const start = startOfWeek(date, { weekStartsOn: 1 }); // Ensure week starts on Monday
            const end = endOfWeek(date, { weekStartsOn: 1 }); // Ensure week ends on Sunday
            interval = { start, end };
            title = `Weekly Report: ${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            const start = startOfMonth(date);
            const end = endOfMonth(date);
            interval = { start, end };
            title = `Monthly Report: ${format(start, 'MMMM yyyy')}`;
        }

        const salesInPeriod = salesData.filter(sale => {
            const saleTime = new Date(sale.saleTimestamp);
            return isWithinInterval(saleTime, interval);
        });

        const total = salesInPeriod.reduce((acc, sale) => acc + sale.totalAmount, 0);

        // Process sales data for display
        const processedSales = salesInPeriod.map(sale => {
            let productName = 'N/A', price = 'N/A', quantity = 0;
            if (Array.isArray(sale.sale_items) && sale.sale_items.length > 0) {
                productName = sale.sale_items.map(item => item.productName || 'N/A').join(', ');
                price = sale.sale_items
                    .map(item => formatCurrency(item.productPrice || 0))
                    .join(', ');
                quantity = sale.sale_items.reduce((sum, item) => sum + (item.quantity || 0), 0);
            }
            return {
                ...sale,
                productName,
                price,
                quantity,
                staffName: sale.createdBy || 'N/A', // Use createdBy from useSales hook
                status: sale.status || 'Unknown',
            };
        });

        // Sort by most recent first
        processedSales.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

        return {
            reportTitle: title,
            totalSales: total,
            filteredSales: processedSales,
        };
    }, [salesData, selectedDate, reportType]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setReportType('daily'); // Switch to daily report when a date is clicked
    };

    return (
        <div className="report-page p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Sales Report</h1>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0 md:w-80">
                    <h2 className="text-lg font-semibold mb-2">Report Controls</h2>
                    <div className="mb-4 bg-white p-3 rounded-lg border">
                        <p className="font-medium mb-2 text-sm">Report Type</p>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setReportType('weekly')}
                                className={`w-full ${reportType === 'weekly' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'}`}
                            >
                                Weekly
                            </Button>
                            <Button
                                onClick={() => setReportType('monthly')}
                                className={`w-full ${reportType === 'monthly' ? 'bg-primary text-primary-foreground' : 'bg-gray-200'}`}
                            >
                                Monthly
                            </Button>
                        </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                        <p className="font-medium mb-2 text-sm">Select Date</p>
                        <DayPicker
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateClick}
                            className="p-0"
                        />
                    </div>
                </div>
                {isLoading && <div className="flex-grow">Loading sales data...</div>}
                {error && (
                    <div className="flex-grow text-red-500">
                        Error loading sales: {error.message}
                    </div>
                )}
                {!isLoading && !error && (
                    <SalesReportDisplay
                        title={reportData.reportTitle}
                        totalSales={reportData.totalSales}
                        salesList={reportData.filteredSales}
                    />
                )}
            </div>
        </div>
    );
};

export default ReportPage;

