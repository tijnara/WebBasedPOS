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
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
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
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Date & Time</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Customer</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Item</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Price</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Quantity</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Payment Method</th>
                                <th className="px-4 py-2 text-right text-sm font-medium text-gray-500">Amount</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Payment Method</th>
                                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {salesList.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-gray-500">
                                        No sales found for this period.
                                    </td>
                                </tr>
                            ) : (
                                salesList.map(sale => (
                                    <tr key={sale.id}>
                                        <td className="px-4 py-2 whitespace-nowrap">
                                            {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                                        </td>
                                        <td className="px-4 py-2 whitespace-nowrap">{sale.customerName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{sale.productName}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{formatCurrency(sale.price)}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{sale.quantity}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{sale.paymentMethod}</td>
                                        <td className="px-4 py-2 whitespace-nowrap">{sale.status}</td>
                                        <td className="px-4 py-2 text-right whitespace-nowrap">
                                            {formatCurrency(sale.totalAmount)}
                                        </td>
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

        salesInPeriod.forEach(sale => {
            if (Array.isArray(sale.sale_items)) {
                sale.productName = sale.sale_items.map(item => item.productName).join(', ');
                sale.price = sale.sale_items.map(item => item.priceAtSale).join(', ');
                sale.quantity = sale.sale_items.reduce((sum, item) => sum + item.quantity, 0);
            } else {
                sale.productName = 'N/A';
                sale.price = 'N/A';
                sale.quantity = 0;
            }

            // Fetch the status directly from the sales table
            sale.status = sale.status || 'Unknown';
        });

        salesInPeriod.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

        return {
            reportTitle: title,
            totalSales: total,
            filteredSales: salesInPeriod,
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
