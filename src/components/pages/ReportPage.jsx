import React, { useState, useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Button } from '../ui';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(numericAmount);
};

const SalesReportDisplay = ({ title, totalSales, salesList, currentPage, totalPages, onPageChange }) => (
    <div className="flex-grow">
        <div className="flex flex-col gap-2 mb-2">
            <h2 className="text-base font-semibold leading-tight">{title}</h2>
            <div className="bg-gray-50 p-2 rounded border text-xs flex items-center justify-between">
                <span>Total Sales:</span>
                <span className="font-bold text-base">{formatCurrency(totalSales)}</span>
            </div>
            <span className="text-xs text-gray-500">Sales in Period ({salesList.length})</span>
        </div>
        <div className="bg-white rounded border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Date & Time</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Customer</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Item(s)</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Price(s)</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Qty</th>
                            <th className="px-2 py-1 text-right font-medium text-gray-600">Total</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Payment</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Status</th>
                            <th className="px-2 py-1 text-left font-medium text-gray-600">Staff</th>
                        </tr>
                    </thead>
                    <tbody>
                        {salesList.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="text-center p-4 text-gray-400">No sales found for this period.</td>
                            </tr>
                        ) : (
                            salesList.map(sale => (
                                <tr key={sale.id} className="border-b last:border-b-0">
                                    <td className="px-2 py-1 whitespace-nowrap">{format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.customerName}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.productName}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.price}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.quantity}</td>
                                    <td className="px-2 py-1 text-right whitespace-nowrap">{formatCurrency(sale.totalAmount)}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.paymentMethod}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.status}</td>
                                    <td className="px-2 py-1 whitespace-nowrap">{sale.staffName || 'N/A'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-1 py-2 text-xs">
                    <Button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="px-2 py-1">Prev</Button>
                    {[...Array(totalPages)].map((_, idx) => (
                        <Button
                            key={idx + 1}
                            onClick={() => onPageChange(idx + 1)}
                            className={`px-2 py-1 ${currentPage === idx + 1 ? 'bg-primary text-primary-foreground' : 'bg-gray-200'}`}
                        >{idx + 1}</Button>
                    ))}
                    <Button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-2 py-1">Next</Button>
                </div>
            )}
        </div>
    </div>
);

const ReportPage = () => {
    const { data: salesData, isLoading, error } = useSales();
    const [reportType, setReportType] = useState('weekly');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const reportData = useMemo(() => {
        if (!salesData) {
            return { reportTitle: 'Loading...', totalSales: 0, filteredSales: [] };
        }

        let interval;
        let title;
        const date = selectedDate || new Date();
        const dayStart = new Date(date.setHours(0, 0, 0, 0));

        if (reportType === 'daily') {
            const end = new Date(date.setHours(23, 59, 59, 999));
            interval = { start: dayStart, end };
            title = `Daily Report: ${format(dayStart, 'MMM d, yyyy')}`;
        } else if (reportType === 'weekly') {
            const start = startOfWeek(dayStart, { weekStartsOn: 1 });
            const end = endOfWeek(dayStart, { weekStartsOn: 1 });
            interval = { start, end };
            title = `Weekly Report: ${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
        } else {
            const start = startOfMonth(dayStart);
            const end = endOfMonth(dayStart);
            interval = { start, end };
            title = `Monthly Report: ${format(start, 'MMMM yyyy')}`;
        }

        const salesInPeriod = salesData.filter(sale => {
            const saleTime = new Date(sale.saleTimestamp);
            return isWithinInterval(saleTime, interval);
        });

        const total = salesInPeriod.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);

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
                staffName: sale.createdBy || 'N/A',
                status: sale.status || 'Unknown',
            };
        });

        processedSales.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

        return {
            reportTitle: title,
            totalSales: total,
            filteredSales: processedSales,
        };
    }, [salesData, selectedDate, reportType]);

    const paginatedSales = useMemo(() => {
        const allSales = reportData.filteredSales || [];
        const totalPages = Math.max(1, Math.ceil(allSales.length / ITEMS_PER_PAGE));
        const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        if (currentPage !== validCurrentPage) {
            setCurrentPage(validCurrentPage);
        }
        const startIdx = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;
        return {
            sales: allSales.slice(startIdx, endIdx),
            totalPages,
        };
    }, [reportData.filteredSales, currentPage]);

    const handleDateClick = (date) => {
        if (date) {
            setSelectedDate(date);
            setReportType('daily');
            setCurrentPage(1);
        }
    };

    const handleReportTypeChange = (e) => {
        setReportType(e.target.value);
        setCurrentPage(1);
    };

    return (
        <div className="report-page max-w-4xl mx-auto p-2 md:p-4">
            <h1 className="text-lg font-bold mb-2">Sales Report</h1>
            <div className="flex flex-col gap-2 mb-2">
                <div className="flex flex-wrap gap-2 items-center bg-gray-50 p-2 rounded border">
                    <span className="font-medium text-xs">Report Type:</span>
                    <select value={reportType} onChange={handleReportTypeChange} className="text-xs px-2 py-1 rounded border">
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                    <span className="font-medium text-xs ml-4">Select Date:</span>
                    <div className="inline-block"><DayPicker mode="single" selected={selectedDate} onSelect={handleDateClick} className="p-0 text-xs" /></div>
                </div>
            </div>
            {isLoading && <div className="text-xs text-gray-500">Loading sales data...</div>}
            {error && (<div className="text-xs text-red-500">Error loading sales: {error.message}</div>)}
            {!isLoading && !error && (
                <SalesReportDisplay
                    title={reportData.reportTitle}
                    totalSales={reportData.totalSales}
                    salesList={paginatedSales.sales}
                    currentPage={currentPage}
                    totalPages={paginatedSales.totalPages}
                    onPageChange={page => setCurrentPage(page)}
                />
            )}
        </div>
    );
};

export default ReportPage;

