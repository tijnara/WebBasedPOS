import React, { useState, useMemo, useRef } from 'react';
import { useSales } from '../../hooks/useSales';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Button } from '../ui'; // Assuming Button from ui.js is available

// Helper hook for detecting clicks outside an element
const useOutsideClick = (ref, callback) => {
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (ref.current && !ref.current.contains(event.target)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
};

// Utility to format currency
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

// --- Calendar Icon (Simple SVG) ---
const CalendarIcon = (props) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-4 h-4"
        {...props}
    >
        <path
            fillRule="evenodd"
            d="M5.75 3a.75.75 0 01.75.75v.25h7V3.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5v-.25A.75.75 0 015.75 3zM4.5 10.75a.75.75 0 01.75-.75h10a.75.75 0 010 1.5H5.25a.75.75 0 01-.75-.75zM4 6.75A1.25 1.25 0 015.25 5.5h9.5A1.25 1.25 0 0116 6.75v1.5H4v-1.5z"
            clipRule="evenodd"
        />
    </svg>
);

// --- Pagination Component ---
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pageNumbers = [...Array(totalPages)].map((_, idx) => idx + 1);

    return (
        <div className="flex justify-center items-center flex-wrap gap-2 py-3 text-xs font-medium">
            <Button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 flex items-center gap-1 rounded-md"
            >
                <span className="w-4 h-4">{'<'}</span> Prev
            </Button>

            {pageNumbers.map(number => (
                <Button
                    key={number}
                    onClick={() => onPageChange(number)}
                    className={`px-3 py-1.5 rounded-md ${
                        currentPage === number
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                >
                    {number}
                </Button>
            ))}

            <Button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 flex items-center gap-1 rounded-md"
            >
                Next <span className="w-4 h-4">{'>'}</span>
            </Button>
        </div>
    );
};

// --- Mobile Sale Card ---
const SaleCard = ({ sale }) => (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
            {/* Header: Date and Total */}
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm font-semibold text-gray-800">
                        {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-gray-500">{sale.customerName}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(sale.totalAmount)}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sale.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                        {sale.status || 'Unknown'}
                    </span>
                </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 pt-2 border-t">
                <h4 className="text-xs font-medium text-gray-500">Items</h4>
                {(sale.sale_items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex-1 truncate pr-2">
                            <span className="font-medium text-gray-800">{item.productName || 'N/A'}</span>
                            <span className="text-gray-500 ml-2">x{item.quantity || 0}</span>
                        </div>
                        <div className="text-gray-700 whitespace-nowrap">
                            {formatCurrency(item.productPrice || 0)}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer: Staff & Payment */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t">
                <span>Staff: <span className="font-medium text-gray-700">{sale.staffName || 'N/A'}</span></span>
                <span>Payment: <span className="font-medium text-gray-700">{sale.paymentMethod}</span></span>
            </div>
        </div>
    </div>
);


// --- Sales Report Table / Cards ---
const SalesReportDisplay = ({ salesList, currentPage, totalPages, onPageChange }) => (
    <div className="bg-white rounded-lg border shadow-sm md:overflow-hidden">

        {/* --- Desktop Table --- */}
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-base">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date & Time</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Item(s)</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Price(s)</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Payment</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Staff</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {salesList.length === 0 ? (
                    <tr>
                        <td colSpan="9" className="text-center p-6 text-gray-500 text-lg">
                            No sales found for this period.
                        </td>
                    </tr>
                ) : (
                    salesList.map(sale => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap align-top">{format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}</td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">{sale.customerName}</td>
                            <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                    {(sale.sale_items || []).map((item, idx) => (
                                        <span key={idx} className="block truncate" title={item.productName}>
                                            {item.productName || 'N/A'}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3 align-top">
                                <div className="flex flex-col gap-1">
                                    {(sale.sale_items || []).map((item, idx) => (
                                        <span key={idx} className="block whitespace-nowrap">
                                            {formatCurrency(item.productPrice || 0)}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3 align-top text-center">
                                <div className="flex flex-col gap-1">
                                    {(sale.sale_items || []).map((item, idx) => (
                                        <span key={idx} className="block">
                                            {item.quantity || 0}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap align-top font-semibold">
                                {formatCurrency(sale.totalAmount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">{sale.paymentMethod}</td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">{sale.status}</td>
                            <td className="px-4 py-3 whitespace-nowrap align-top">{sale.staffName || 'N/A'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>

        {/* --- Mobile Cards --- */}
        <div className="md:hidden p-2 space-y-3 bg-gray-50">
            {salesList.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No sales found for this period.
                </div>
            ) : (
                salesList.map(sale => (
                    <SaleCard key={sale.id} sale={sale} />
                ))
            )}
        </div>


        {/* --- Pagination (Common) --- */}
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
        />
    </div>
);

// --- Main Report Page Component ---
const ReportPage = () => {
    const [reportType, setReportType] = useState('weekly');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const popoverRef = useRef(null);
    const ITEMS_PER_PAGE = 10;
    useOutsideClick(popoverRef, () => setIsCalendarOpen(false));

    // Calculate interval for report type
    let interval;
    const date = selectedDate || new Date();
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    if (reportType === 'daily') {
        const end = new Date(date.setHours(23, 59, 59, 999));
        interval = { start: dayStart, end };
    } else if (reportType === 'weekly') {
        const start = startOfWeek(dayStart, { weekStartsOn: 1 });
        const end = endOfWeek(dayStart, { weekStartsOn: 1 });
        interval = { start, end };
    } else {
        const start = startOfMonth(dayStart);
        const end = endOfMonth(dayStart);
        interval = { start, end };
    }
    // Pass interval to useSales
    const { data: salesData, isLoading, error } = useSales({ startDate: interval.start, endDate: interval.end });

    // Remove client-side date filtering in useMemo, only process and paginate
    const reportData = useMemo(() => {
        if (!salesData) {
            return { reportTitle: 'Loading...', totalSales: 0, filteredSales: [] };
        }
        let title;
        if (reportType === 'daily') {
            title = `Daily Report: ${format(interval.start, 'MMM d, yyyy')}`;
        } else if (reportType === 'weekly') {
            title = `Weekly Report: ${format(interval.start, 'MMM d')} - ${format(interval.end, 'MMM d, yyyy')}`;
        } else {
            title = `Monthly Report: ${format(interval.start, 'MMMM yyyy')}`;
        }
        // No need to filter salesData by date, already filtered by useSales
        const processedSales = salesData.map(sale => ({
            ...sale,
            staffName: sale.createdBy || 'N/A',
            status: sale.status || 'Unknown',
        }));
        processedSales.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));
        const total = processedSales.reduce((acc, sale) => acc + (sale.totalAmount || 0), 0);
        return {
            reportTitle: title,
            totalSales: total,
            filteredSales: processedSales,
            salesCount: processedSales.length,
        };
    }, [salesData, reportType, interval]);

    // Memoized pagination logic
    const paginatedSales = useMemo(() => {
        const allSales = reportData.filteredSales || [];
        const totalPages = Math.max(1, Math.ceil(allSales.length / ITEMS_PER_PAGE));

        const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        if (currentPage !== validCurrentPage && allSales.length > 0) {
            setCurrentPage(validCurrentPage);
        }

        const startIdx = (validCurrentPage - 1) * ITEMS_PER_PAGE;
        const endIdx = startIdx + ITEMS_PER_PAGE;

        return {
            sales: allSales.slice(startIdx, endIdx),
            totalPages,
        };
    }, [reportData.filteredSales, currentPage]);

    // --- Event Handlers ---
    const handleDateSelect = (date) => {
        if (date) {
            setSelectedDate(date);
            setReportType('daily');
            setCurrentPage(1);
            setIsCalendarOpen(false);
        }
    };

    // Render JSX
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* --- Report Header --- */}
            <div className="mb-4">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                    Sales Report
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2">
                    {/* Report Type & Date Range */}
                    <div>
                        <select
                            value={reportType}
                            onChange={(e) => setReportType(e.target.value)}
                            className="text-sm border rounded-md p-2 mr-2"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </select>
                        <div className="text-sm text-gray-500">
                            {reportData.reportTitle}
                        </div>
                    </div>

                    {/* Date Picker (for Daily/Weekly reports) */}
                    {reportType !== 'monthly' && (
                        <div className="mt-2 sm:mt-0">
                            <Button
                                onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                className="px-3 py-1.5 flex items-center gap-1 rounded-md"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                {format(selectedDate, reportType === 'daily' ? 'MMM d, yyyy' : 'MMM d')}
                            </Button>
                            {isCalendarOpen && (
                                <div
                                    ref={popoverRef}
                                    className="absolute z-10 mt-2 p-4 bg-white rounded-lg shadow-lg border"
                                >
                                    <DayPicker
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={handleDateSelect}
                                        footer={null}
                                        modifiersStyles={{
                                            today: {
                                                backgroundColor: '#e0f7fa',
                                                borderRadius: '0.375rem',
                                            },
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* --- Sales Report Content --- */}
            {isLoading ? (
                <div className="text-center py-6 text-gray-500">
                    Loading sales data...
                </div>
            ) : error ? (
                <div className="text-center py-6 text-red-500">
                    Error loading sales data. Please try again later.
                </div>
            ) : (
                <SalesReportDisplay
                    salesList={paginatedSales.sales}
                    currentPage={currentPage}
                    totalPages={paginatedSales.totalPages}
                    onPageChange={setCurrentPage}
                />
            )}
        </div>
    );
}

export default ReportPage;
