import React, { useState, useMemo, useRef } from 'react';
import { useSales } from '../../hooks/useSales';
import { useSalesSummary } from '../../hooks/useSalesSummary'; // <-- Correct import
import { useCustomers } from '../../hooks/useCustomers';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth
} from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Button, Input, Select } from '../ui'; // Added Select
import MobileLogoutButton from '../MobileLogoutButton';
import Pagination from '../Pagination';

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

// --- Customer Card (Mobile) ---
const CustomerCard = ({ customer }) => (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
            {/* Header: Name and Date Added */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{customer.name}</div>
                    <div className="text-xs text-gray-500">{customer.phone || 'No phone'}</div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                    <div className="text-xs text-gray-500">
                        {customer.dateAdded ? format(customer.dateAdded, 'MMM d, yyyy') : 'N/A'}
                    </div>
                </div>
            </div>
            {/* Details */}
            <div className="space-y-1 pt-2 border-t">
                {customer.email && (
                    <div className="text-xs">
                        <span className="text-gray-500">Email: </span>
                        <span className="text-gray-700">{customer.email}</span>
                    </div>
                )}
                {customer.address && (
                    <div className="text-xs">
                        <span className="text-gray-500">Address: </span>
                        <span className="text-gray-700">{customer.address}</span>
                    </div>
                )}
            </div>
            {/* Footer: Added By */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3 border-t">
                <span>Added by: <span className="font-medium text-gray-700">{customer.users?.name || 'N/A'}</span></span>
            </div>
        </div>
    </div>
);

// --- Customer Report Display ---
const CustomerReportDisplay = ({ customersList, currentPage, totalPages, onPageChange }) => (
    <div className="bg-white rounded-lg border shadow-sm md:overflow-hidden">
        {/* --- Desktop Table --- */}
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-base">
                <thead className="bg-gray-100">
                <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Address</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Date Added</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">Added By</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                {customersList.length === 0 ? (
                    <tr>
                        <td colSpan="6" className="text-center p-6 text-gray-500 text-lg">
                            No customers found.
                        </td>
                    </tr>
                ) : (
                    customersList.map(customer => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                            <td className="px-4 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-600">{customer.email || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-600">{customer.address || 'N/A'}</td>
                            <td className="px-4 py-3 text-gray-600">
                                {customer.dateAdded ? format(customer.dateAdded, 'MMM d, yyyy') : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{customer.users?.name || 'N/A'}</td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
        {/* --- Mobile Cards --- */}
        <div className="md:hidden p-2 space-y-3 bg-gray-50">
            {customersList.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No customers found.
                </div>
            ) : (
                customersList.map(customer => (
                    <CustomerCard key={customer.id} customer={customer} />
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

// --- Inactive Customers Table ---
const InactiveCustomersTable = ({ inactiveCustomers, isLoading, error }) => (
    <div className="bg-white rounded-lg border shadow-sm md:overflow-hidden">
        <div className="bg-primary-soft border-b px-4 py-3">
            <h3 className="text-base font-semibold text-primary">Inactive Customers (14+ Days)</h3>
            <p className="text-xs text-gray-600 mt-1">Customers who haven't ordered in the last 2 weeks</p>
        </div>
        {/* --- Desktop Table --- */}
        <div className="overflow-x-auto hidden md:block">
            {isLoading ? (
                <div className="text-center p-6 text-gray-500">Loading inactive customers...</div>
            ) : error ? (
                <div className="text-center p-6 text-red-600">Error loading inactive customers</div>
            ) : (
                <table className="min-w-full text-base">
                    <thead className="bg-gray-100">
                    <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Phone</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Last Order</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                    {inactiveCustomers.length === 0 ? (
                        <tr>
                            <td colSpan="3" className="text-center p-6 text-gray-500 text-lg">
                                No inactive customers found.
                            </td>
                        </tr>
                    ) : (
                        inactiveCustomers.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium text-gray-800">{customer.name}</td>
                                <td className="px-4 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                                <td className="px-4 py-3 text-gray-600">
                                    {customer.last_order_date
                                        ? format(new Date(customer.last_order_date), 'MMM d, yyyy')
                                        : 'Never ordered'}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            )}
        </div>
        {/* --- Mobile Cards --- */}
        <div className="md:hidden p-2 space-y-3 bg-gray-50">
            {isLoading ? (
                <div className="text-center p-6 text-gray-500">Loading...</div>
            ) : error ? (
                <div className="text-center p-6 text-red-600">Error loading data</div>
            ) : inactiveCustomers.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No inactive customers found.
                </div>
            ) : (
                inactiveCustomers.map(customer => (
                    <div key={customer.id} className="bg-white rounded-lg border shadow-sm p-3">
                        <div className="font-medium text-gray-800">{customer.name}</div>
                        <div className="text-xs text-gray-500 mt-1">{customer.phone || 'No phone'}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            Last Order: {customer.last_order_date
                                ? format(new Date(customer.last_order_date), 'MMM d, yyyy')
                                : 'Never'}
                        </div>
                    </div>
                ))
            )}
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
    const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'customers'
    const [reportType, setReportType] = useState('weekly');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentPage, setCurrentPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [inactivePage, setInactivePage] = useState(1);
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const [fromDate, setFromDate] = useState(null); // custom range start
    const [toDate, setToDate] = useState(null);     // custom range end
    const [elevated, setElevated] = useState(false); // filter bar elevation
    const popoverRef = useRef(null);
    const SALES_PAGE_SIZE = 10;
    const CUSTOMER_PAGE_SIZE = 5;
    useOutsideClick(popoverRef, () => setIsCalendarOpen(false));
    // Elevation on scroll
    React.useEffect(() => {
        const onScroll = () => setElevated(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    // Calculate interval for report type
    const interval = useMemo(() => {
        // Base interval from reportType + selectedDate
        const date = selectedDate || new Date();
        const dayStart = new Date(date.setHours(0, 0, 0, 0));
        let baseStart, baseEnd;
        if (reportType === 'daily') {
            baseStart = new Date(dayStart);
            baseEnd = new Date(new Date(dayStart).setHours(23, 59, 59, 999));
        } else if (reportType === 'weekly') {
            baseStart = startOfWeek(dayStart, { weekStartsOn: 1 });
            baseEnd = endOfWeek(dayStart, { weekStartsOn: 1 });
        } else { // monthly
            baseStart = startOfMonth(dayStart);
            baseEnd = endOfMonth(dayStart);
        }
        // If both custom dates are provided, override
        if (fromDate && toDate) {
            const start = new Date(fromDate);
            start.setHours(0,0,0,0);
            const end = new Date(toDate);
            end.setHours(23,59,59,999);
            // If range is reversed, swap
            if (start > end) {
                return { start: end, end: start };
            }
            return { start, end };
        }
        return { start: baseStart, end: baseEnd };
    }, [selectedDate, reportType, fromDate, toDate]);
    const activeRangeLabel = useMemo(() => {
        return `${format(interval.start, 'MMM d, yyyy')} - ${format(interval.end, 'MMM d, yyyy')}`;
    }, [interval]);
    // Pass interval AND pagination to useSales for the list
    const {
        data: salesPageData,
        isLoading: isLoadingList,
        error: listError
    } = useSales({
        startDate: interval.start,
        endDate: interval.end,
        page: currentPage,
        itemsPerPage: SALES_PAGE_SIZE
    });
    // Call new hook for the total summary
    const {
        data: summaryData,
        isLoading: isLoadingSummary,
        error: summaryError
    } = useSalesSummary({
        startDate: interval.start,
        endDate: interval.end
    });
    // Fetch customer data
    const {
        data: customersPageData,
        isLoading: isLoadingCustomers,
        error: customersError
    } = useCustomers({
        page: customerPage,
        itemsPerPage: CUSTOMER_PAGE_SIZE,
        startDate: interval.start,
        endDate: interval.end,
    });

    // Fetch inactive customers (14+ days)
    const {
        data: inactiveCustomersPage,
        isLoading: isLoadingInactive,
        error: inactiveError
    } = useInactiveCustomers(14, { page: inactivePage, itemsPerPage: CUSTOMER_PAGE_SIZE });
    // Combine loading and error states
    const isLoading = activeTab === 'sales'
        ? (isLoadingList || isLoadingSummary)
        : isLoadingCustomers;
    const error = activeTab === 'sales'
        ? (listError || summaryError)
        : customersError;
    // Get data from hooks with fallbacks
    const salesData = salesPageData?.sales || [];
    const totalPages = activeTab === 'sales'
        ? (salesPageData?.totalPages || 1)
        : (customersPageData?.totalPages || 1);
    const totalSalesCount = salesPageData?.totalCount || 0;
    const totalRevenue = summaryData?.totalRevenue || 0;
    const customersData = customersPageData?.customers || [];
    const totalCustomersCount = customersPageData?.totalCount || 0;
    const inactiveCustomers = inactiveCustomersPage?.customers || [];
    const inactiveHasMore = !!inactiveCustomersPage?.hasMore;
    // Memoized title
    const reportTitle = useMemo(() => {
        if (reportType === 'daily') {
            return `Daily Report: ${format(interval.start, 'MMM d, yyyy')}`;
        } else if (reportType === 'weekly') {
            return `Weekly Report: ${format(interval.start, 'MMM d')} - ${format(interval.end, 'MMM d, yyyy')}`;
        } else { // monthly
            return `Monthly Report: ${format(interval.start, 'MMMM yyyy')}`;
        }
    }, [reportType, interval]);
    // Memoized processing for the *paginated* sales list
    const processedSales = useMemo(() => {
        return salesData.map(sale => ({
            ...sale,
            staffName: sale.createdBy || 'N/A',
            status: sale.status || 'Unknown',
        })).sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));
    }, [salesData]);

    // Memoized processing for customers list
    const processedCustomers = useMemo(() => {
        return customersData.sort((a, b) => {
            const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
            const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
            return dateB - dateA;
        });
    }, [customersData]);

    // --- Event Handlers ---
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page when switching tabs
        setCustomerPage(1);
        setInactivePage(1);
    };
    const handleDateSelect = (date) => {
        if (date) {
            setSelectedDate(date);
            setReportType('daily');
            setCurrentPage(1); // Reset to first page
            setIsCalendarOpen(false);
        }
    };
    const handleReportTypeChange = (e) => {
        setReportType(e.target.value);
        setCurrentPage(1); // Reset to first page
    };
    // Handlers for custom range
    const handleFromDateChange = (e) => {
        const v = e.target.value ? new Date(e.target.value) : null;
        setFromDate(v);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };
    const handleToDateChange = (e) => {
        const v = e.target.value ? new Date(e.target.value) : null;
        setToDate(v);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };
    const handleClearRange = () => {
        setFromDate(null);
        setToDate(null);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };
    const getSelectedDateDisplay = () => {
        if (reportType === 'daily') return format(selectedDate, 'MMM d, yyyy');
        if (reportType === 'weekly') {
            const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
            const end = endOfWeek(selectedDate, { weekStartsOn: 1 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
        }
        if (reportType === 'monthly') {
            return format(selectedDate, 'MMMM yyyy');
        }
        return format(selectedDate, 'MMM d, yyyy');
    }
    // --- Render JSX ---
    return (
        <div className="report-page max-w-7xl mx-auto p-2 md:p-4 space-y-4">
            {/* Mobile Logo */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            {/* Mobile Logout Button */}
            <MobileLogoutButton />

            <h1 className="text-2xl font-bold">Reports</h1>

            {/* --- Tab Navigation --- */}
            <div className="flex gap-2 border-b">
                <Button
                    onClick={() => handleTabChange('sales')}
                    className={`px-4 py-2 font-semibold rounded-md ${activeTab === 'sales' ? 'btn--primary' : 'btn--soft'}`}
                >
                    Sales Report
                </Button>
                <Button
                    onClick={() => handleTabChange('customers')}
                    className={`px-4 py-2 font-semibold rounded-md ${activeTab === 'customers' ? 'btn--primary' : 'btn--soft'}`}
                >
                    Customer Report
                </Button>
            </div>

            {/* --- Sales Report Tab --- */}
            {activeTab === 'sales' && (
                <>
            {/* --- Controls & Totals Card --- */}
            <div className={`filter-bar bg-white rounded-lg border p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
                {/* Top Row: Total Sales & Date Range */}
                <div className="mb-4 pb-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">
                            Total Sales for Period
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-primary">
                            {isLoading ? '...' : formatCurrency(totalRevenue)}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary border border-primary whitespace-nowrap">
                            {activeRangeLabel}
                        </span>
                        {fromDate && toDate && (
                            <span className="px-2 py-1 rounded-md bg-primary text-white text-xs font-medium whitespace-nowrap">
                                Custom Range
                            </span>
                        )}
                    </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-col md:flex-row md:items-end gap-3 flex-wrap">
                    {/* Report Type */}
                    <div className="flex-shrink-0">
                        <label htmlFor="reportType" className="block text-xs font-medium text-gray-700 mb-1">
                            Report Type
                        </label>
                        <Select
                            id="reportType"
                            value={reportType}
                            onChange={handleReportTypeChange}
                            className="text-sm"
                        >
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                        </Select>
                    </div>

                    {/* Date Picker */}
                    <div className="relative flex-shrink-0" ref={popoverRef}>
                        <label htmlFor="datePicker" className="block text-xs font-medium text-gray-700 mb-1">
                            Select Date
                        </label>
                        <Button
                            id="datePicker"
                            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                            className="px-3 py-2 text-sm flex items-center gap-2 rounded-md btn--primary hover:opacity-90"
                        >
                            <CalendarIcon />
                            <span>{getSelectedDateDisplay()}</span>
                        </Button>
                        {isCalendarOpen && (
                            <div className="absolute top-full mt-2 z-30 bg-white border rounded-lg shadow-lg left-0">
                                <DayPicker
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={handleDateSelect}
                                />
                            </div>
                        )}
                    </div>

                    {/* Date From */}
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                        <Input
                            type="date"
                            className="text-sm"
                            value={fromDate ? new Date(fromDate).toISOString().slice(0,10) : ''}
                            onChange={handleFromDateChange}
                        />
                    </div>

                    {/* Date To */}
                    <div className="flex-shrink-0">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                        <Input
                            type="date"
                            className="text-sm"
                            value={toDate ? new Date(toDate).toISOString().slice(0,10) : ''}
                            onChange={handleToDateChange}
                        />
                    </div>

                    {/* Clear Range Button */}
                    {(fromDate || toDate) && (
                        <Button
                            onClick={handleClearRange}
                            disabled={!fromDate && !toDate}
                            className="px-3 py-2 text-sm rounded-md btn--outline disabled:opacity-50"
                            title="Clear custom date range"
                        >
                            Clear Range
                        </Button>
                    )}
                </div>
            </div>
            {/* --- Report Title --- */}
            <div className="px-1">
                <h2 className="text-lg font-semibold leading-tight">{reportTitle}</h2>
                <span className="text-sm text-gray-500">
                    {totalSalesCount} sales found
                </span>
            </div>
                    {/* --- Loading / Error / Report Display --- */}
                    {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading sales data...</div>}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                            Error loading sales: {error.message}
                        </div>
                    )}
                    {!isLoading && !error && (
                        <SalesReportDisplay
                            salesList={processedSales}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    )}
                </>
            )}

            {/* --- Customer Report Tab --- */}
            {activeTab === 'customers' && (
                <>
                    {/* --- Controls Card --- */}
                    <div className={`filter-bar bg-white rounded-lg border p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
                        {/* Top Row: Total Customers & Date Range */}
                        <div className="mb-4 pb-3 border-b flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    Total Customers for Period
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-primary">
                                    {isLoading ? '...' : totalCustomersCount}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary border border-primary whitespace-nowrap">
                                    {activeRangeLabel}
                                </span>
                                {fromDate && toDate && (
                                    <span className="px-2 py-1 rounded-md bg-primary text-white text-xs font-medium whitespace-nowrap">
                                        Custom Range
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-col md:flex-row md:items-end gap-3 flex-wrap">
                            {/* Report Type */}
                            <div className="flex-shrink-0">
                                <label htmlFor="customerReportType" className="block text-xs font-medium text-gray-700 mb-1">
                                    Report Type
                                </label>
                                <Select
                                    id="customerReportType"
                                    value={reportType}
                                    onChange={handleReportTypeChange}
                                    className="text-sm"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Select>
                            </div>

                            {/* Date Picker */}
                            <div className="relative flex-shrink-0" ref={popoverRef}>
                                <label htmlFor="customerDatePicker" className="block text-xs font-medium text-gray-700 mb-1">
                                    Select Date
                                </label>
                                <Button
                                    id="customerDatePicker"
                                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                                    className="px-3 py-2 text-sm flex items-center gap-2 rounded-md btn--primary hover:opacity-90"
                                >
                                    <CalendarIcon />
                                    <span>{getSelectedDateDisplay()}</span>
                                </Button>
                                {isCalendarOpen && (
                                    <div className="absolute top-full mt-2 z-30 bg-white border rounded-lg shadow-lg left-0">
                                        <DayPicker
                                            mode="single"
                                            selected={selectedDate}
                                            onSelect={handleDateSelect}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Date From */}
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date From</label>
                                <Input
                                    type="date"
                                    className="text-sm"
                                    value={fromDate ? new Date(fromDate).toISOString().slice(0,10) : ''}
                                    onChange={handleFromDateChange}
                                />
                            </div>

                            {/* Date To */}
                            <div className="flex-shrink-0">
                                <label className="block text-xs font-medium text-gray-700 mb-1">Date To</label>
                                <Input
                                    type="date"
                                    className="text-sm"
                                    value={toDate ? new Date(toDate).toISOString().slice(0,10) : ''}
                                    onChange={handleToDateChange}
                                />
                            </div>

                            {/* Clear Range Button */}
                            {(fromDate || toDate) && (
                                <Button
                                    onClick={handleClearRange}
                                    disabled={!fromDate && !toDate}
                                    className="px-3 py-2 text-sm rounded-md btn--outline disabled:opacity-50"
                                    title="Clear custom date range"
                                >
                                    Clear Range
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* --- Customer List Title --- */}
                    <div className="px-1">
                        <h2 className="text-lg font-semibold leading-tight">{reportTitle.replace('Report', 'Customer Report')}</h2>
                        <span className="text-sm text-gray-500">
                            {totalCustomersCount} customers found
                        </span>
                    </div>

                    {/* --- Loading / Error / Customer Display --- */}
                    {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading customer data...</div>}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                            Error loading customers: {error.message}
                        </div>
                    )}
                    {!isLoading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:grid-cols-2">
                            {/* Regular Customers Table */}
                            <div className="flex flex-col gap-2">
                                <CustomerReportDisplay
                                    customersList={processedCustomers}
                                    currentPage={customerPage}
                                    totalPages={totalPages}
                                    onPageChange={page => setCustomerPage(page)}
                                />
                            </div>

                            {/* Inactive Customers Table */}
                            <div className="flex flex-col gap-2">
                                <InactiveCustomersTable
                                    inactiveCustomers={inactiveCustomers}
                                    isLoading={isLoadingInactive}
                                    error={inactiveError}
                                />
                                {/* Inactive pagination (Prev/Next only) */}
                                <div className="flex justify-center items-center gap-2 py-2">
                                    <Button
                                        className="btn--soft px-3 py-1 text-xs"
                                        disabled={inactivePage === 1}
                                        onClick={() => setInactivePage(p => Math.max(1, p - 1))}
                                    >
                                        Prev
                                    </Button>
                                    <span className="text-xs text-gray-600">Page {inactivePage}</span>
                                    <Button
                                        className="btn--primary px-3 py-1 text-xs disabled:opacity-50"
                                        disabled={!inactiveHasMore}
                                        onClick={() => setInactivePage(p => p + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ReportPage;
