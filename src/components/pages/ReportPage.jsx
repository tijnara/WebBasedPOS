// src/components/pages/ReportPage.jsx
import React, { useState, useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useInactiveCustomers } from '../../hooks/useInactiveCustomers';
import { useDeleteSale } from '../../hooks/useDeleteSale';
import { useDebounce } from '../../hooks/useDebounce';
import { useStore } from '../../store/useStore';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Button, Input, Select } from '../ui';
import { DeleteIcon } from '../Icons';

import Pagination from '../Pagination';
import WeeklySalesChart from '../charts/WeeklySalesChart';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import currency from 'currency.js';

// Utility to format currency
const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

// --- Mobile Sale Card ---
const SaleCard = ({ sale, onDelete, isAdmin }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
                <div>
                    <div className="text-sm font-semibold text-gray-800">
                        {format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}
                    </div>
                    <div className="text-xs text-gray-500">{sale.customerName}</div>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                    <div className="text-lg font-bold text-gray-900">
                        {formatCurrency(sale.totalAmount)}
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sale.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                        {sale.status || 'Unknown'}
                    </span>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 bg-red-50 mt-1"
                            onClick={() => onDelete(sale.id)}
                        >
                            <DeleteIcon className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
            <div className="space-y-2 pt-2">
                <h4 className="text-xs font-medium text-gray-500">Items</h4>
                {(sale.sale_items || []).map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm">
                        <div className="flex-1 truncate pr-2">
                            <span className="font-medium text-gray-800">{item.productName || 'N/A'}</span>
                            <span className="text-primary font-bold ml-2">x{item.quantity || 0}</span>
                        </div>
                        <div className="text-right">
                            <div className="text-gray-700 whitespace-nowrap">
                                {formatCurrency(item.productPrice || 0)}
                            </div>
                            {item.discount_amount > 0 && (
                                <div className="text-xs text-green-600">
                                    -{formatCurrency(item.discount_amount)}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                <span>Staff: <span className="font-medium text-gray-700">{sale.staffName || 'N/A'}</span></span>
                <span>Payment: <span className="font-medium text-gray-700">{sale.paymentMethod}</span></span>
            </div>
        </div>
    </div>
);

// --- Customer Card (Mobile) ---
const CustomerCard = ({ customer }) => (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 space-y-3">
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
            <div className="space-y-1 pt-2">
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
            <div className="flex justify-between items-center text-xs text-gray-500 pt-3">
                <span>Added by: <span className="font-medium text-gray-700">{customer.users?.name || 'N/A'}</span></span>
            </div>
        </div>
    </div>
);

// --- Customer Report Display ---
const CustomerReportDisplay = ({ customersList, currentPage, totalPages, onPageChange }) => (
    <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Name</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Phone</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Email</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Address</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Date Added</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Added By</th>
                    </tr>
                </thead>
                <tbody className="">
                    {customersList.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="text-center p-6 text-gray-500 text-sm">
                                No customers found.
                            </td>
                        </tr>
                    ) : (
                        customersList.map(customer => (
                            <tr key={customer.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                                <td className="px-3 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                                <td className="px-3 py-3 text-gray-600">{customer.email || 'N/A'}</td>
                                <td className="px-3 py-3 text-gray-600">{customer.address || 'N/A'}</td>
                                <td className="px-3 py-3 text-gray-600">
                                    {customer.dateAdded ? format(customer.dateAdded, 'MMM d, yyyy') : 'N/A'}
                                </td>
                                <td className="px-3 py-3 text-gray-600">{customer.users?.name || 'N/A'}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
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
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
        />
    </div>
);

// --- Inactive Customers Table ---
const InactiveCustomersTable = ({ inactiveCustomers, isLoading, error }) => (
    <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
        <div className="bg-primary-soft px-3 py-3">
            <h3 className="text-sm font-semibold text-primary">Inactive Customers (14+ Days)</h3>
            <p className="text-xs text-gray-600 mt-1">Customers who haven't ordered in the last 2 weeks</p>
        </div>
        <div className="overflow-x-auto hidden md:block">
            {isLoading ? (
                <div className="text-center p-6 text-gray-500">Loading inactive customers...</div>
            ) : error ? (
                <div className="text-center p-6 text-red-600">Error loading inactive customers</div>
            ) : (
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Name</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Phone</th>
                            <th className="px-3 py-3 text-left font-semibold text-gray-700">Last Order</th>
                        </tr>
                    </thead>
                    <tbody className="">
                        {inactiveCustomers.length === 0 ? (
                            <tr>
                                <td colSpan="3" className="text-center p-6 text-gray-500 text-sm">
                                    No inactive customers found.
                                </td>
                            </tr>
                        ) : (
                            inactiveCustomers.map(customer => (
                                <tr key={customer.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-3 font-medium text-gray-800">{customer.name}</td>
                                    <td className="px-3 py-3 text-gray-600">{customer.phone || 'N/A'}</td>
                                    <td className="px-3 py-3 text-gray-600">
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
                    <div key={customer.id} className="bg-white rounded-lg shadow-sm p-3">
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
const SalesReportDisplay = ({ salesList, currentPage, totalPages, onPageChange, onDelete, isAdmin }) => (
    <div className="bg-white rounded-lg shadow-sm md:overflow-hidden">
        <div className="overflow-x-auto hidden md:block">
            <table className="min-w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Date & Time</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Customer</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Item(s) & Qty</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Price(s)</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Discount</th>
                        <th className="px-3 py-3 text-center font-semibold text-gray-700">Total Qty</th>
                        <th className="px-3 py-3 text-right font-semibold text-gray-700">Total</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Payment</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-3 py-3 text-left font-semibold text-gray-700">Staff</th>
                        {isAdmin && <th className="px-3 py-3 text-right font-semibold text-gray-700">Action</th>}
                    </tr>
                </thead>
                <tbody className="">
                    {salesList.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? "11" : "10"} className="text-center p-6 text-gray-500 text-sm">
                                No sales found for this period.
                            </td>
                        </tr>
                    ) : (
                        salesList.map(sale => (
                            <tr key={sale.id} className="hover:bg-gray-50">
                                <td className="px-3 py-3 whitespace-nowrap align-top">{format(new Date(sale.saleTimestamp), 'MMM d, yyyy h:mm a')}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.customerName}</td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col gap-1">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <span key={idx} className="block truncate" title={item.productName}>
                                                {item.productName || 'N/A'} <span className="font-bold text-primary">x{item.quantity || 0}</span>
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col gap-1">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <span key={idx} className="block whitespace-nowrap">
                                                {formatCurrency(item.productPrice || 0)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top">
                                    <div className="flex flex-col gap-1">
                                        {(sale.sale_items || []).map((item, idx) => (
                                            <span key={idx} className={`block whitespace-nowrap ${item.discount_amount > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}`}>
                                                {item.discount_amount > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-3 py-3 align-top text-center font-medium text-gray-800">
                                    {(sale.sale_items || []).reduce((acc, item) => acc + (item.quantity || 0), 0)}
                                </td>
                                <td className="px-3 py-3 text-right whitespace-nowrap align-top font-bold text-gray-900">
                                    {formatCurrency(sale.totalAmount)}
                                </td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.paymentMethod}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.status}</td>
                                <td className="px-3 py-3 whitespace-nowrap align-top">{sale.staffName || 'N/A'}</td>

                                {isAdmin && (
                                    <td className="px-3 py-3 text-right align-top">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:bg-red-50 h-8 w-8"
                                            onClick={() => onDelete(sale.id)}
                                        >
                                            <DeleteIcon className="w-4 h-4" />
                                        </Button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        <div className="md:hidden p-2 space-y-3 bg-gray-50">
            {salesList.length === 0 ? (
                <div className="text-center p-6 text-gray-500">
                    No sales found for this period.
                </div>
            ) : (
                salesList.map(sale => (
                    <SaleCard key={sale.id} sale={sale} onDelete={onDelete} isAdmin={isAdmin} />
                ))
            )}
        </div>
        <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
        />
    </div>
);

// --- Main Report Page Component ---
const ReportPage = () => {
    const user = useStore(state => state.user);
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

    const [activeTab, setActiveTab] = useState('sales');
    const [currentPage, setCurrentPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [inactivePage, setInactivePage] = useState(1);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const debouncedCustomerSearch = useDebounce(customerSearch, 300);

    const { data: allProductsData } = useProducts({ fetchAll: true, excludeHidden: true });
    const availableProducts = allProductsData?.products || [];

    // Default to current week Mon–Sun (Philippines, weekStartsOn: Monday)
    const _now = new Date();
    const _weekFrom = format(startOfWeek(_now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const _weekTo   = format(endOfWeek(_now,   { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [fromDate, setFromDate] = useState(_weekFrom);
    const [toDate, setToDate] = useState(_weekTo);
    const [elevated, setElevated] = useState(false);

    const SALES_PAGE_SIZE = 10;
    const CUSTOMER_PAGE_SIZE = 5;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);

    const deleteSaleMutation = useDeleteSale();

    React.useEffect(() => {
        const onScroll = () => setElevated(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const interval = useMemo(() => {
        const start = fromDate ? new Date(fromDate) : new Date();
        start.setHours(0, 0, 0, 0);

        const end = toDate ? new Date(toDate) : new Date();
        end.setHours(23, 59, 59, 999);

        if (start > end) return { start: end, end: start };
        return { start, end };
    }, [fromDate, toDate]);

    const activeRangeLabel = useMemo(() => {
        if (format(interval.start, 'yyyy-MM-dd') === format(interval.end, 'yyyy-MM-dd')) {
            return format(interval.start, 'MMM d, yyyy');
        }
        return `${format(interval.start, 'MMM d, yyyy')} - ${format(interval.end, 'MMM d, yyyy')}`;
    }, [interval]);

    const {
        data: salesPageData,
        isLoading: isLoadingList,
        error: listError
    } = useSales({
        startDate: interval.start,
        endDate: interval.end,
        productId: selectedProductId,
        searchTerm: debouncedCustomerSearch,
        page: currentPage,
        itemsPerPage: SALES_PAGE_SIZE
    });

    const { data: allSalesData } = useSales({
        startDate: interval.start,
        endDate: interval.end,
        productId: selectedProductId,
        searchTerm: debouncedCustomerSearch,
        fetchAll: true,
    });

    const {
        data: summaryData,
        isLoading: isLoadingSummary,
        error: summaryError
    } = useSalesSummary({
        startDate: interval.start,
        endDate: interval.end,
        productId: selectedProductId
    });

    const {
        data: customersPageData,
        isLoading: isLoadingCustomers,
        error: customersError
    } = useCustomers({
        page: customerPage,
        itemsPerPage: CUSTOMER_PAGE_SIZE,
        startDate: interval.start,
        endDate: interval.end,
        searchTerm: debouncedCustomerSearch
    });

    const {
        data: inactiveCustomersPage,
        isLoading: isLoadingInactive,
        error: inactiveError
    } = useInactiveCustomers(14, { page: inactivePage, itemsPerPage: CUSTOMER_PAGE_SIZE });

    const isLoading = activeTab === 'sales'
        ? (isLoadingList || isLoadingSummary)
        : isLoadingCustomers;

    const error = activeTab === 'sales'
        ? (listError || summaryError)
        : customersError;

    const salesData = salesPageData?.sales || [];
    const chartSalesData = allSalesData?.sales || [];
    const totalPages = activeTab === 'sales'
        ? (salesPageData?.totalPages || 1)
        : (customersPageData?.totalPages || 1);
    const totalSalesCount = salesPageData?.totalCount || 0;
    const totalRevenue = summaryData?.totalRevenue || 0;



    const customersData = customersPageData?.customers || [];
    const totalCustomersCount = customersPageData?.totalCount || 0;
    const inactiveCustomers = inactiveCustomersPage?.customers || [];
    const inactiveHasMore = !!inactiveCustomersPage?.hasMore;

    const reportTitle = useMemo(() => {
        if (format(interval.start, 'yyyy-MM-dd') === format(interval.end, 'yyyy-MM-dd')) {
            return `Daily Report: ${format(interval.start, 'MMMM d, yyyy')}`;
        }
        return `Custom Report: ${format(interval.start, 'MMM d, yyyy')} - ${format(interval.end, 'MMM d, yyyy')}`;
    }, [interval]);

    const processedSales = useMemo(() => {
        return salesData.map(sale => ({
            ...sale,
            staffName: sale.createdBy || 'N/A',
            status: sale.status || 'Unknown',
        })).sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));
    }, [salesData]);

    const processedCustomers = useMemo(() => {
        return customersData.sort((a, b) => {
            const dateA = a.dateAdded ? new Date(a.dateAdded) : new Date(0);
            const dateB = b.dateAdded ? new Date(b.dateAdded) : new Date(0);
            return dateB - dateA;
        });
    }, [customersData]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };

    const handleFromDateChange = (e) => {
        setFromDate(e.target.value);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };

    const handleToDateChange = (e) => {
        setToDate(e.target.value);
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
    };

    const handleClearRange = () => {
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
        setCustomerPage(1);
        setInactivePage(1);
        setSelectedProductId('');
        setCustomerSearch('');
    };

    const openDeleteModal = (id) => {
        setSaleToDelete(id);
        setIsModalOpen(true);
        deleteSaleMutation.reset();
    };

    const closeDeleteModal = () => {
        setIsModalOpen(false);
        setSaleToDelete(null);
    };

    const handleConfirmDelete = (reason) => {
        if (saleToDelete) {
            deleteSaleMutation.mutate({ saleId: saleToDelete, reason });
        }
    };

    return (
        <div className="report-page max-w-7xl mx-auto p-2 md:p-4 space-y-4 responsive-page">
            <h1 className="text-2xl font-bold">Reports</h1>

            <div className="flex gap-2">
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

            {activeTab === 'sales' && (
                <>
                    <div className={`filter-bar bg-white rounded-lg p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
                        <div className="mb-4 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    Total Sales for Period
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-primary">
                                    {isLoading ? '...' : formatCurrency(totalRevenue)}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary whitespace-nowrap">
                                    {activeRangeLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                                    <Input
                                        type="date"
                                        className="text-base md:text-sm h-10 w-full"
                                        value={fromDate || ''}
                                        onChange={handleFromDateChange}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                                    <Input
                                        type="date"
                                        className="text-base md:text-sm h-10 w-full"
                                        value={toDate || ''}
                                        onChange={handleToDateChange}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Product</label>
                                    <Select
                                        value={selectedProductId}
                                        onChange={(e) => {
                                            setSelectedProductId(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                        className="text-base md:text-sm w-full h-10"
                                    >
                                        <option value="">All Products</option>
                                        {availableProducts.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </Select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                                    <Input
                                        type="text"
                                        placeholder="Search customer..."
                                        className="text-base md:text-sm h-10 w-full"
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setCurrentPage(1);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                                <div className="text-xs text-gray-500 italic">
                                    Note: For a single day report, select the same date for Date From and Date To.
                                </div>
                                {(fromDate || toDate || selectedProductId || customerSearch) && (
                                    <div className="flex-shrink-0">
                                        <Button
                                            onClick={handleClearRange}
                                            className="px-6 py-2 text-sm rounded-md btn--outline w-full md:w-max"
                                            title="Clear filters"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="my-4">
                        <WeeklySalesChart
                            salesData={chartSalesData}
                            startDate={interval.start}
                            endDate={interval.end}
                        />
                    </div>

                    <div className="px-1 flex flex-col md:flex-row md:items-end md:justify-between gap-1">
                        <div>
                            <h2 className="text-lg font-semibold leading-tight">{reportTitle}</h2>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="text-sm text-gray-500">
                                    {totalSalesCount} sales found
                                </span>
                                <span className="text-gray-300">|</span>

                                {/* DYNAMICALLY RENDER ALL PRODUCTS SOLD IN THIS REPORT PERIOD */}
                                {summaryData?.productQuantities && Object.values(summaryData.productQuantities).map((p, idx) => (
                                    <span key={idx} className="text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                        {p.name}: {p.quantity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading sales data...</div>}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                            Error loading sales: {error.message}
                        </div>
                    )}
                    {!isLoading && !error && (
                        <SalesReportDisplay
                            salesList={processedSales}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={page => setCurrentPage(page)}
                            onDelete={openDeleteModal}
                            isAdmin={isAdmin}
                        />
                    )}
                </>
            )}

            {activeTab === 'customers' && (
                <>
                    <div className={`filter-bar bg-white rounded-lg p-4 transition-shadow sticky top-0 z-20 ${elevated ? 'shadow-md' : 'shadow-sm'}`}>
                        <div className="mb-4 pb-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                            <div>
                                <div className="text-xs font-medium text-gray-500 mb-1">
                                    Total Customers for Period
                                </div>
                                <div className="text-2xl md:text-3xl font-bold text-primary">
                                    {isLoading ? '...' : totalCustomersCount}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary-soft text-primary whitespace-nowrap">
                                    {activeRangeLabel}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
                                    <Input
                                        type="date"
                                        className="text-base md:text-sm h-10 w-full"
                                        value={fromDate || ''}
                                        onChange={handleFromDateChange}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
                                    <Input
                                        type="date"
                                        className="text-base md:text-sm h-10 w-full"
                                        value={toDate || ''}
                                        onChange={handleToDateChange}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 w-full">
                                <div className="flex-1 hidden md:block" />
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Search Customer</label>
                                    <Input
                                        type="text"
                                        placeholder="Search customer..."
                                        className="text-base md:text-sm h-10 w-full"
                                        value={customerSearch}
                                        onChange={(e) => {
                                            setCustomerSearch(e.target.value);
                                            setCustomerPage(1);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mt-2">
                                <div className="text-xs text-gray-500 italic">
                                    Note: For a single day report, select the same date for Date From and Date To.
                                </div>
                                {(fromDate || toDate || customerSearch) && (
                                    <div className="flex-shrink-0">
                                        <Button
                                            onClick={handleClearRange}
                                            className="px-6 py-2 text-sm rounded-md btn--outline w-full md:w-max"
                                            title="Clear filters"
                                        >
                                            Clear Filters
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="px-1">
                        <h2 className="text-lg font-semibold leading-tight">{reportTitle.replace('Report', 'Customer Report')}</h2>
                        <span className="text-sm text-gray-500">
                            {totalCustomersCount} customers found
                        </span>
                    </div>

                    {isLoading && <div className="text-sm text-gray-500 p-4 text-center">Loading customer data...</div>}
                    {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-4 rounded-lg">
                            Error loading customers: {error.message}
                        </div>
                    )}
                    {!isLoading && !error && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start md:grid-cols-2">
                            <div className="flex flex-col gap-2">
                                <CustomerReportDisplay
                                    customersList={processedCustomers}
                                    currentPage={customerPage}
                                    totalPages={totalPages}
                                    onPageChange={page => setCustomerPage(page)}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <InactiveCustomersTable
                                    inactiveCustomers={inactiveCustomers}
                                    isLoading={isLoadingInactive}
                                    error={inactiveError}
                                />
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

            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                isMutating={deleteSaleMutation.isPending}
                isSuccess={deleteSaleMutation.isSuccess}
            />
        </div>
    );
};

export default ReportPage;
