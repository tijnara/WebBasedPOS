// src/components/pages/ReportPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useSales, useUpdateSale } from '../../hooks/useSales';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useProducts } from '../../hooks/useProducts';
import { useDeleteSale } from '../../hooks/useDeleteSale';
import { useDebounce } from '../../hooks/useDebounce';
import { useStore } from '../../store/useStore';
import {
    format,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    subDays,
    subWeeks
} from 'date-fns';
import {
    Button, Input, Select, Dialog, DialogContent,
    DialogTitle, DialogCloseButton, Label
} from '../ui';
import { useWeeklyGrowth } from '../../hooks/useWeeklyGrowth';
import { useMonthlyGrowth } from '../../hooks/useMonthlyGrowth';
import SummaryCard from '../ui/SummaryCard';
import DeleteConfirmationModal from '../DeleteConfirmationModal';
import currency from 'currency.js';
import { Pencil } from 'lucide-react';

// Extracted Modular Tabs
import SalesTab from '../reports/SalesTab';
import FrequentOrdersTab from '../reports/FrequentOrdersTab';
import LapsedCustomersTab from '../reports/LapsedCustomersTab';

const formatCurrency = (amount) => {
    return currency(amount, { symbol: '₱', precision: 2 }).format();
};

// Admin Edit Modal for Reports
const EditSaleModal = ({ sale, isOpen, onClose }) => {
    if (!sale) return null;
    const updateSaleMutation = useUpdateSale();

    const [status, setStatus] = useState(sale.status || 'Completed');
    const [paymentMethod, setPaymentMethod] = useState(sale.paymentMethod || 'Cash');
    const [customerName, setCustomerName] = useState(sale.customerName || '');
    const [amountReceived, setAmountReceived] = useState(String(sale.amountReceived || sale.totalAmount || 0));

    useEffect(() => {
        if (sale) {
            setStatus(sale.status || 'Completed');
            setPaymentMethod(sale.paymentMethod || 'Cash');
            setCustomerName(sale.customerName || '');
            setAmountReceived(String(sale.amountReceived || sale.totalAmount || 0));
        }
    }, [sale]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amountReceived);
        const change = paymentMethod === 'Cash' && amt >= sale.totalAmount
            ? amt - sale.totalAmount
            : 0;

        await updateSaleMutation.mutateAsync({
            saleId: sale.id,
            originalSale: sale,
            updates: {
                status,
                paymentMethod,
                customerName: customerName.trim(),
                amountReceived: isNaN(amt) ? sale.totalAmount : amt,
                changeGiven: change
            }
        });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 sm:max-w-md w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-lime-100 text-[#5f7d00] flex items-center justify-center">
                            <Pencil className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>Edit Transaction #{sale.id}</span>
                    </DialogTitle>
                    <DialogCloseButton onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex justify-between items-center text-xs">
                            <span className="text-slate-500 font-semibold">Total Amount:</span>
                            <span className="text-base font-black text-slate-900">{formatCurrency(sale.totalAmount)}</span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700">Customer Name</Label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Payment Method</Label>
                                <Select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="GCash">GCash</option>
                                    <option value="Charge">Charge (Utang)</option>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700">Status</Label>
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                >
                                    <option value="Completed">Completed</option>
                                    <option value="Unpaid">Unpaid</option>
                                    <option value="Pending">Pending</option>
                                    <option value="Cancelled">Cancelled</option>
                                </Select>
                            </div>
                        </div>

                        {paymentMethod === 'Cash' && (
                            <div>
                                <Label className="text-xs font-bold text-slate-700">Amount Received (₱)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                        <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateSaleMutation.isPending}
                            className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                        >
                            {updateSaleMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ReportPage = () => {
    const searchParams = useSearchParams();
    const user = useStore(state => state.user);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.is_admin || user.isSuperAdmin) return true;

        const role = String(user.role?.name || user.role || user.position || user.user_type || user.type || '').toLowerCase().trim();
        if (['admin', 'administrator', 'owner', 'superadmin', 'manager', 'head'].some(k => role.includes(k))) {
            return true;
        }

        if (user.role_id === 1 || user.roleId === 1) return true;

        const name = String(user.name || '').toLowerCase();
        const username = String(user.username || '').toLowerCase();
        if (name.includes('aranjit') || name.includes('admin') || username.includes('admin') || username.includes('aranjit')) {
            return true;
        }

        if (role && !['staff', 'cashier', 'crew', 'employee'].includes(role)) {
            return true;
        }

        return false;
    }, [user]);

    const [activeTab, setActiveTab] = useState('sales');
    const [currentPage, setCurrentPage] = useState(1);
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

    const FREQUENT_PAGE_SIZE = 10;

    // Modals State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [saleToDelete, setSaleToDelete] = useState(null);
    const [editingSale, setEditingSale] = useState(null);

    const deleteSaleMutation = useDeleteSale();

    const weeklyGrowthDate = useMemo(() => toDate ? new Date(toDate) : new Date(), [toDate]);
    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth(weeklyGrowthDate);
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth(weeklyGrowthDate);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'frequent') {
            setActiveTab('frequent');
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
        return `${startStr} — ${endStr}`;
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

    const { data: frequentData, isLoading: isLoadingFrequent } = useQuery({
        queryKey: ['frequent-customers', user?.isDemo, frequentMonth, frequentPage, frequentSortCol, frequentSortDesc, debouncedCustomerSearch],
        queryFn: async () => {
            if (!frequentMonth) return { customers: [], totalPages: 0, totalCount: 0 };

            const [year, month] = frequentMonth.split('-');
            const startDate = new Date(Number(year), Number(month) - 1, 1).toISOString();
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59, 999).toISOString();

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
        : isLoadingFrequent;

    const error = activeTab === 'sales' ? (salesError || summaryError) : null;

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
        : (frequentData?.totalPages || 1);

    const totalRevenue = summaryData?.totalRevenue || 0;
    const totalGallonsSold = summaryData?.totalGallons || 0;

    const reportTitle = useMemo(() => {
        if (!interval.start && !interval.end) return 'Custom Report: All Time';
        if (interval.start && interval.end && format(interval.start, 'yyyy-MM-dd') === format(interval.end, 'yyyy-MM-dd')) {
            return `Daily Report: ${format(interval.start, 'MMMM d, yyyy')}`;
        }
        const startStr = interval.start ? format(interval.start, 'MMM d, yyyy') : 'Start';
        const endStr = interval.end ? format(interval.end, 'MMM d, yyyy') : 'Present';
        return `${startStr} — ${endStr}`;
    }, [interval]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setFrequentPage(1);
    };

    const handleFromDateChange = (e) => {
        setFromDate(e.target.value);
        setCurrentPage(1);
    };

    const handleToDateChange = (e) => {
        setToDate(e.target.value);
        setCurrentPage(1);
    };

    // Quick Date Presets Handler
    const handlePresetRange = (preset) => {
        const today = new Date();
        setCurrentPage(1);

        switch (preset) {
            case 'today': {
                const d = format(today, 'yyyy-MM-dd');
                setFromDate(d);
                setToDate(d);
                break;
            }
            case 'yesterday': {
                const y = format(subDays(today, 1), 'yyyy-MM-dd');
                setFromDate(y);
                setToDate(y);
                break;
            }
            case 'this_week': {
                setFromDate(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                setToDate(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                break;
            }
            case 'last_week': {
                const lastWeekDate = subWeeks(today, 1);
                setFromDate(format(startOfWeek(lastWeekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                setToDate(format(endOfWeek(lastWeekDate, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
                break;
            }
            case 'this_month': {
                setFromDate(format(startOfMonth(today), 'yyyy-MM-dd'));
                setToDate(format(endOfMonth(today), 'yyyy-MM-dd'));
                break;
            }
            default:
                break;
        }
    };

    const handleClearRange = () => {
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
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

    const openDeleteModal = (saleOrId) => {
        setSaleToDelete(saleOrId);
        setIsModalOpen(true);
        deleteSaleMutation.reset();
    };

    const closeDeleteModal = () => {
        setIsModalOpen(false);
        setSaleToDelete(null);
    };

    const handleConfirmDelete = (reason) => {
        if (saleToDelete) {
            const saleId = typeof saleToDelete === 'object' ? saleToDelete.id : saleToDelete;
            deleteSaleMutation.mutate({ saleId, reason });
        }
    };

    const openEditModal = (sale) => {
        setEditingSale(sale);
    };

    const closeEditModal = () => {
        setEditingSale(null);
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
                    percentage={Math.abs(monthlyGrowthData?.salesGrowth || 0)}
                    isPositive={(monthlyGrowthData?.salesGrowth || 0) >= 0}
                    isPositiveColor={(monthlyGrowthData?.thisMonthSales || 0) >= (monthlyGrowthData?.lastMonthSales || 0)}
                    comparisonText={`(${format(monthlyGrowthData?.thisMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.thisMonthEnd || new Date(), 'd')}) vs. (${format(monthlyGrowthData?.lastMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.lastMonthEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Monthly Gallons Sold"
                    isLoading={isMonthlyGrowthLoading}
                    value={`${(monthlyGrowthData?.thisMonthGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(monthlyGrowthData?.lastMonthGallons || 0).toLocaleString()} gal`}
                    previousPeriodRange={monthlyGrowthData?.lastMonthStart ? `(${format(monthlyGrowthData.lastMonthStart, 'MMM d')} - ${format(monthlyGrowthData.lastMonthEnd, 'd')})` : undefined}
                    percentage={Math.abs(monthlyGrowthData?.gallonsGrowth || 0)}
                    isPositive={(monthlyGrowthData?.gallonsGrowth || 0) >= 0}
                    isPositiveColor={(monthlyGrowthData?.thisMonthGallons || 0) >= (monthlyGrowthData?.lastMonthGallons || 0)}
                    comparisonText={`(${format(monthlyGrowthData?.thisMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.thisMonthEnd || new Date(), 'd')}) vs. (${format(monthlyGrowthData?.lastMonthStart || new Date(), 'MMM d')} - ${format(monthlyGrowthData?.lastMonthEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Weekly Sales"
                    isLoading={isWeeklyGrowthLoading}
                    value={`₱${(weeklyGrowthData?.thisWeekSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousValue={`₱${(weeklyGrowthData?.lastWeekSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    previousPeriodRange={weeklyGrowthData?.lastWeekStart ? `(${format(weeklyGrowthData.lastWeekStart, 'MMM d')} - ${format(weeklyGrowthData.lastWeekEnd, 'd')})` : undefined}
                    percentage={Math.abs(weeklyGrowthData?.salesGrowth || 0)}
                    isPositive={(weeklyGrowthData?.salesGrowth || 0) >= 0}
                    isPositiveColor={(weeklyGrowthData?.thisWeekSales || 0) >= (weeklyGrowthData?.lastWeekSales || 0)}
                    comparisonText={`(${format(weeklyGrowthData?.thisWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.thisWeekEnd || new Date(), 'd')}) vs. (${format(weeklyGrowthData?.lastWeekStart || new Date(), 'MMM d')} - ${format(weeklyGrowthData?.lastWeekEnd || new Date(), 'd')})`}
                />
                <SummaryCard
                    title="Weekly Gallons Sold"
                    isLoading={isWeeklyGrowthLoading}
                    value={`${(weeklyGrowthData?.thisWeekGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(weeklyGrowthData?.lastWeekGallons || 0).toLocaleString()} gal`}
                    previousPeriodRange={weeklyGrowthData?.lastWeekStart ? `(${format(weeklyGrowthData.lastWeekStart, 'MMM d')} - ${format(weeklyGrowthData.lastWeekEnd, 'd')})` : undefined}
                    percentage={Math.abs(weeklyGrowthData?.gallonsGrowth || 0)}
                    isPositive={(weeklyGrowthData?.gallonsGrowth || 0) >= 0}
                    isPositiveColor={(weeklyGrowthData?.thisWeekGallons || 0) >= (weeklyGrowthData?.lastWeekGallons || 0)}
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
                    onClick={() => handleTabChange('frequent')}
                    className={`px-4 py-2 font-semibold rounded-md ${activeTab === 'frequent' ? 'btn--primary' : 'btn--soft'}`}
                >
                    Frequent Orders
                </Button>
                <Button
                    onClick={() => handleTabChange('inactive')}
                    className={`px-4 py-2 font-semibold rounded-md ${activeTab === 'inactive' ? 'btn--primary' : 'btn--soft'}`}
                >
                    Dropped Off
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
                    handlePresetRange={handlePresetRange}
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
                    openEditModal={openEditModal}
                    onEditSale={openEditModal}
                    isAdmin={isAdmin}
                    currentDateKey={currentDateKey}
                />
            )}

            {activeTab === 'inactive' && <LapsedCustomersTab enabled={activeTab === 'inactive'} />}

            <DeleteConfirmationModal
                isOpen={isModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                isMutating={deleteSaleMutation.isPending}
                isSuccess={deleteSaleMutation.isSuccess}
            />

            <EditSaleModal
                sale={editingSale}
                isOpen={!!editingSale}
                onClose={closeEditModal}
            />
        </div>
    );
};

export default ReportPage;