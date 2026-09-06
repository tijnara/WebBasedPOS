import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useSales } from '../../hooks/useSales';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useCustomers } from '../../hooks/useCustomers';
import { useProducts } from '../../hooks/useProducts';
import { useDeleteSale } from '../../hooks/useDeleteSale';
import { useDebounce } from '../../hooks/useDebounce';
import { useStore } from '../../store/useStore';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Button } from '../ui';
import { useWeeklyGrowth } from '../../hooks/useWeeklyGrowth';
import { useMonthlyGrowth } from '../../hooks/useMonthlyGrowth';
import SummaryCard from '../ui/SummaryCard';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import SalesTab from '../reports/SalesTab';
import CustomerTab from '../reports/CustomerTab';
import FrequentOrdersTab from '../reports/FrequentOrdersTab';

const ReportPage = () => {
    const searchParams = useSearchParams();
    const user = useStore(state => state.user);
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin';

    const [activeTab, setActiveTab] = useState('sales');
    const [currentPage, setCurrentPage] = useState(1);
    const [customerPage, setCustomerPage] = useState(1);
    const [frequentPage, setFrequentPage] = useState(1);

    const [frequentMonth, setFrequentMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [frequentSortCol, setFrequentSortCol] = useState('monthly');
    const [frequentSortDesc, setFrequentSortDesc] = useState(true);

    const [selectedProductId, setSelectedProductId] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const debouncedCustomerSearch = useDebounce(customerSearch, 300);

    const { data: allProductsData } = useProducts({ fetchAll: true, excludeHidden: true });
    const availableProducts = allProductsData?.products || [];

    const _now = new Date();
    const _weekFrom = format(startOfWeek(_now, { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const _weekTo = format(endOfWeek(_now, { weekStartsOn: 1 }), 'yyyy-MM-dd');

    const [fromDate, setFromDate] = useState(_weekFrom);
    const [toDate, setToDate] = useState(_weekTo);
    const [elevated, setElevated] = useState(false);

    const CUSTOMER_PAGE_SIZE = 5;
    const FREQUENT_PAGE_SIZE = 10;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);

    const deleteSaleMutation = useDeleteSale();

    const weeklyGrowthDate = useMemo(() => toDate ? new Date(toDate) : new Date(), [toDate]);
    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth(weeklyGrowthDate);
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth(weeklyGrowthDate);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'customers') {
            setActiveTab('customers');
        }
    }, [searchParams]);

    useEffect(() => {
        const onScroll = () => setElevated(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const interval = useMemo(() => {
        let start = fromDate ? new Date(fromDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        let end = toDate ? new Date(toDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

        if (start && end && start > end) return { start: end, end: start };
        return { start, end };
    }, [fromDate, toDate]);

    const activeRangeLabel = useMemo(() => {
        if (!interval.start && !interval.end) return 'All Time';
        if (interval.start && interval.end && format(interval.start, 'yyyy-MM-dd') === format(interval.end, 'yyyy-MM-dd')) {
            return format(interval.start, 'MMM d, yyyy');
        }
        const startStr = interval.start ? format(interval.start, 'MMM d, yyyy') : 'Start';
        const endStr = interval.end ? format(interval.end, 'MMM d, yyyy') : 'Present';
        return `${startStr} - ${endStr}`;
    }, [interval]);

    const {
        data: allSalesData,
        isLoading: isLoadingSales,
        error: salesError
    } = useSales({
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

    const { data: frequentData, isLoading: isLoadingFrequent } = useQuery({
        queryKey: ['frequent-customers', user?.isDemo, frequentMonth, frequentPage, frequentSortCol, frequentSortDesc, debouncedCustomerSearch],
        queryFn: async () => {
            if (!frequentMonth) return { customers: [], totalPages: 0, totalCount: 0 };

            const [year, month] = frequentMonth.split('-');
            const startDate = new Date(year, month - 1, 1).toISOString();
            const endDate = new Date(year, month, 0, 23, 59, 59, 999).toISOString();

            const weekStartIso = startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();
            const weekEndIso = endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString();

            const from = (frequentPage - 1) * FREQUENT_PAGE_SIZE;
            const to = from + FREQUENT_PAGE_SIZE - 1;

            if (user?.isDemo) {
                let mockCustomers = [
                    { customername: 'Demo Customer A', monthly_order_count: 12, weekly_order_count: 3 },
                    { customername: 'Demo Customer B', monthly_order_count: 8, weekly_order_count: 1 },
                    { customername: 'Demo Customer C', monthly_order_count: 5, weekly_order_count: 0 },
                ];

                if (debouncedCustomerSearch) {
                    mockCustomers = mockCustomers.filter(c =>
                        c.customername.toLowerCase().includes(debouncedCustomerSearch.toLowerCase())
                    );
                }

                mockCustomers.sort((a, b) => {
                    const valA = frequentSortCol === 'monthly' ? a.monthly_order_count : a.weekly_order_count;
                    const valB = frequentSortCol === 'monthly' ? b.monthly_order_count : b.weekly_order_count;
                    return frequentSortDesc ? valB - valA : valA - valB;
                });

                return {
                    customers: mockCustomers.slice(from, to + 1),
                    totalPages: Math.ceil(mockCustomers.length / FREQUENT_PAGE_SIZE),
                    totalCount: mockCustomers.length
                };
            }

            const { data, error, count } = await supabase
                .rpc('get_frequent_customers',
                    {
                        month_start: startDate,
                        month_end: endDate,
                        week_start: weekStartIso,
                        week_end: weekEndIso,
                        sort_column: frequentSortCol,
                        sort_desc: frequentSortDesc,
                        search_term: debouncedCustomerSearch || ''
                    },
                    { count: 'exact' }
                )
                .range(from, to);

            if (error) {
                console.error("Error fetching frequent customers:", error);
                throw error;
            }

            return {
                customers: data || [],
                totalPages: Math.ceil((count || 0) / FREQUENT_PAGE_SIZE),
                totalCount: count || 0
            };
        },
        staleTime: 1000 * 60 * 5,
    });

    const isLoading = activeTab === 'sales'
        ? (isLoadingSales || isLoadingSummary)
        : activeTab === 'frequent' ? isLoadingFrequent : isLoadingCustomers;

    const error = activeTab === 'sales'
        ? (salesError || summaryError)
        : activeTab === 'frequent' ? null : customersError;

    const allSales = allSalesData?.sales || [];
    const chartSalesData = allSales;
    const totalSalesCount = allSalesData?.totalCount ?? allSales.length;

    const { dateKeys, salesByDate } = useMemo(() => {
        if (!allSales || allSales.length === 0) {
            return { dateKeys: [], salesByDate: {} };
        }

        const groups = {};
        const dates = [];

        const sortedSales = [...allSales].sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

        sortedSales.forEach(sale => {
            const dateObj = new Date(sale.saleTimestamp);
            const dateKey = format(dateObj, 'yyyy-MM-dd');
            if (!groups[dateKey]) {
                groups[dateKey] = [];
                dates.push(dateKey);
            }
            groups[dateKey].push({
                ...sale,
                staffName: sale.createdBy || 'N/A',
                status: sale.status || 'Unknown',
            });
        });

        return { dateKeys: dates, salesByDate: groups };
    }, [allSales]);

    const totalSalesPages = Math.max(1, dateKeys.length);
    const safeCurrentPage = Math.min(Math.max(1, currentPage), totalSalesPages);
    const currentDateKey = dateKeys[safeCurrentPage - 1] || null;
    const processedSales = currentDateKey ? (salesByDate[currentDateKey] || []) : [];

    useEffect(() => {
        if (currentPage > totalSalesPages && totalSalesPages > 0) {
            setCurrentPage(totalSalesPages);
        }
    }, [currentPage, totalSalesPages]);

    const totalPages = activeTab === 'sales'
        ? totalSalesPages
        : activeTab === 'frequent' ? (frequentData?.totalPages || 1) : (customersPageData?.totalPages || 1);

    const totalRevenue = summaryData?.totalRevenue || 0;
    const totalGallonsSold = summaryData?.totalGallons || 0;

    const customersData = customersPageData?.customers || [];
    const totalCustomersCount = customersPageData?.totalCount || 0;

    const reportTitle = useMemo(() => {
        if (!interval.start && !interval.end) return 'Custom Report: All Time';
        if (interval.start && interval.end && format(interval.start, 'yyyy-MM-dd') === format(interval.end, 'yyyy-MM-dd')) {
            return `Daily Report: ${format(interval.start, 'MMMM d, yyyy')}`;
        }
        const startStr = interval.start ? format(interval.start, 'MMM d, yyyy') : 'Start';
        const endStr = interval.end ? format(interval.end, 'MMM d, yyyy') : 'Present';
        return `${startStr} - ${endStr}`;
    }, [interval]);

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
        setFrequentPage(1);
    };

    const handleFromDateChange = (e) => {
        setFromDate(e.target.value);
        setCurrentPage(1);
        setCustomerPage(1);
    };

    const handleToDateChange = (e) => {
        setToDate(e.target.value);
        setCurrentPage(1);
        setCustomerPage(1);
    };

    const handleClearRange = () => {
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
        setCustomerPage(1);
        setSelectedProductId('');
        setCustomerSearch('');
    };

    const handleFrequentSort = (col) => {
        if (frequentSortCol === col) {
            setFrequentSortDesc(!frequentSortDesc);
        } else {
            setFrequentSortCol(col);
            setFrequentSortDesc(true);
        }
        setFrequentPage(1);
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
            <h1 className="text-2xl font-bold dark:text-white">Reports</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <SummaryCard
                    title="Monthly Sales"
                    isLoading={isMonthlyGrowthLoading}
                    value={`₱${(monthlyGrowthData?.thisMonthSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousValue={`₱${(monthlyGrowthData?.lastMonthSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousPeriodRange={monthlyGrowthData?.lastMonthStart ? `(${format(monthlyGrowthData.lastMonthStart, 'MMM d')} - ${format(monthlyGrowthData.lastMonthEnd, 'd')})` : undefined}
                    percentage={Math.abs(monthlyGrowthData?.salesGrowth)}
                    isPositive={monthlyGrowthData?.salesGrowth >= 0}
                    isPositiveColor={monthlyGrowthData?.thisMonthSales >= monthlyGrowthData?.lastMonthSales}
                    comparisonText={`(${format(monthlyGrowthData?.thisMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.thisMonthEnd || new Date(), 'd')}) vs. (${format(monthlyGrowthData?.lastMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.lastMonthEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Monthly Gallons Sold"
                    isLoading={isMonthlyGrowthLoading}
                    value={`${(monthlyGrowthData?.thisMonthGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(monthlyGrowthData?.lastMonthGallons || 0).toLocaleString()} gal`}
                    previousPeriodRange={monthlyGrowthData?.lastMonthStart ? `(${format(monthlyGrowthData.lastMonthStart, 'MMM d')} - ${format(monthlyGrowthData.lastMonthEnd, 'd')})` : undefined}
                    percentage={Math.abs(monthlyGrowthData?.gallonsGrowth)}
                    isPositive={monthlyGrowthData?.gallonsGrowth >= 0}
                    isPositiveColor={monthlyGrowthData?.thisMonthGallons >= monthlyGrowthData?.lastMonthGallons}
                    comparisonText={`(${format(monthlyGrowthData?.thisMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.thisMonthEnd || new Date(), 'd')}) vs. (${format(monthlyGrowthData?.lastMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.lastMonthEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Weekly Sales"
                    isLoading={isWeeklyGrowthLoading}
                    value={`₱${(weeklyGrowthData?.thisWeekSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousValue={`₱${(weeklyGrowthData?.lastWeekSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousPeriodRange={weeklyGrowthData?.lastWeekStart ? `(${format(weeklyGrowthData.lastWeekStart, 'MMM d')} - ${format(weeklyGrowthData.lastWeekEnd, 'd')})` : undefined}
                    percentage={Math.abs(weeklyGrowthData?.salesGrowth)}
                    isPositive={weeklyGrowthData?.salesGrowth >= 0}
                    isPositiveColor={weeklyGrowthData?.thisWeekSales >= weeklyGrowthData?.lastWeekSales}
                    comparisonText={`(${format(weeklyGrowthData?.thisWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.thisWeekEnd || new Date(), 'd')}) vs. (${format(weeklyGrowthData?.lastWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.lastWeekEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Weekly Gallons Sold"
                    isLoading={isWeeklyGrowthLoading}
                    value={`${(weeklyGrowthData?.thisWeekGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(weeklyGrowthData?.lastWeekGallons || 0).toLocaleString()} gal`}
                    previousPeriodRange={weeklyGrowthData?.lastWeekStart ? `(${format(weeklyGrowthData.lastWeekStart, 'MMM d')} - ${format(weeklyGrowthData.lastWeekEnd, 'd')})` : undefined}
                    percentage={Math.abs(weeklyGrowthData?.gallonsGrowth)}
                    isPositive={weeklyGrowthData?.gallonsGrowth >= 0}
                    isPositiveColor={weeklyGrowthData?.thisWeekGallons >= weeklyGrowthData?.lastWeekGallons}
                    comparisonText={`(${format(weeklyGrowthData?.thisWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.thisWeekEnd || new Date(), 'd')}) vs. (${format(weeklyGrowthData?.lastWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.lastWeekEnd || new Date(), 'd')})`}
                />
            </div>

            <div className="flex gap-2 flex-wrap">
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
                <Button
                    onClick={() => handleTabChange('frequent')}
                    className={`px-4 py-2 font-semibold rounded-md ${activeTab === 'frequent' ? 'btn--primary' : 'btn--soft'}`}
                >
                    Frequent Orders
                </Button>
            </div>

            {activeTab === 'frequent' && (
                <FrequentOrdersTab
                    customerSearch={customerSearch}
                    setCustomerSearch={setCustomerSearch}
                    frequentMonth={frequentMonth}
                    setFrequentMonth={setFrequentMonth}
                    frequentPage={frequentPage}
                    setFrequentPage={setFrequentPage}
                    isLoadingFrequent={isLoadingFrequent}
                    frequentData={frequentData}
                    handleFrequentSort={handleFrequentSort}
                    frequentSortCol={frequentSortCol}
                    frequentSortDesc={frequentSortDesc}
                    FREQUENT_PAGE_SIZE={FREQUENT_PAGE_SIZE}
                />
            )}

            {activeTab === 'sales' && (
                <SalesTab
                    elevated={elevated}
                    totalRevenue={totalRevenue}
                    isLoading={isLoading}
                    activeRangeLabel={activeRangeLabel}
                    fromDate={fromDate}
                    handleFromDateChange={handleFromDateChange}
                    toDate={toDate}
                    handleToDateChange={handleToDateChange}
                    selectedProductId={selectedProductId}
                    setSelectedProductId={setSelectedProductId}
                    availableProducts={availableProducts}
                    customerSearch={customerSearch}
                    setCustomerSearch={setCustomerSearch}
                    handleClearRange={handleClearRange}
                    chartSalesData={chartSalesData}
                    interval={interval}
                    reportTitle={reportTitle}
                    totalSalesCount={totalSalesCount}
                    totalGallonsSold={totalGallonsSold}
                    summaryData={summaryData}
                    error={error}
                    processedSales={processedSales}
                    safeCurrentPage={safeCurrentPage}
                    totalPages={totalPages}
                    setCurrentPage={setCurrentPage}
                    openDeleteModal={openDeleteModal}
                    isAdmin={isAdmin}
                    currentDateKey={currentDateKey}
                />
            )}

            {activeTab === 'customers' && (
                <CustomerTab
                    elevated={elevated}
                    totalCustomersCount={totalCustomersCount}
                    isLoading={isLoadingCustomers}
                    activeRangeLabel={activeRangeLabel}
                    fromDate={fromDate}
                    handleFromDateChange={handleFromDateChange}
                    toDate={toDate}
                    handleToDateChange={handleToDateChange}
                    customerSearch={customerSearch}
                    setCustomerSearch={setCustomerSearch}
                    handleClearRange={handleClearRange}
                    reportTitle={reportTitle}
                    error={customersError}
                    processedCustomers={processedCustomers}
                    customerPage={customerPage}
                    totalPages={totalPages}
                    setCustomerPage={setCustomerPage}
                />
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