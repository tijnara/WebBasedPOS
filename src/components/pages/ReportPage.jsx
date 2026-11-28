// src/components/pages/ReportPage.jsx
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useSales, useUpdateSale } from '../../hooks/useSales';
import { useSalesSummary } from '../../hooks/useSalesSummary';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { logActivity } from '../../hooks/useActivityLogs';
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
import currency from 'currency.js';
import {
    Pencil,
    Trash2,
    AlertTriangle,
    BarChart3,
    Droplets,
    TrendingUp,
    TrendingDown,
    Calendar,
    Receipt,
    Repeat,
    UserX
} from 'lucide-react';

// Extracted Modular Tabs & Product Tour
import SalesTab from '../reports/SalesTab';
import FrequentOrdersTab from '../reports/FrequentOrdersTab';
import LapsedCustomersTab from '../reports/LapsedCustomersTab';
import ReportProductTour from '../reports/ReportProductTour';

const formatCurrency = (amount) => {
    return currency(amount, { symbol: '₱', precision: 2 }).format();
};

// Modern Compact KPI Card for 2x2 Mobile / 4-Col Desktop Grid
const ExecutiveKpiCard = ({
                              title,
                              value,
                              previousValue,
                              comparisonRange,
                              percentage = 0,
                              isPositive = true,
                              isLoading = false,
                              icon: Icon,
                              accent = 'lime'
                          }) => {
    const accentStyles = {
        lime: 'bg-lime-50 dark:bg-lime-950/50 text-[#659000] dark:text-lime-400 border-lime-200/70 dark:border-lime-800/50',
        cyan: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400 border-cyan-200/70 dark:border-cyan-800/50',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200/70 dark:border-emerald-800/50',
        blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200/70 dark:border-blue-800/50'
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-3 sm:p-4 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between gap-2 min-w-0">
            <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
                    {title}
                </span>
                {Icon && (
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border flex items-center justify-center shrink-0 ${accentStyles[accent] || accentStyles.lime}`}>
                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="space-y-2 py-1 animate-pulse">
                    <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4" />
                    <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
            ) : (
                <>
                    <div className="space-y-1 min-w-0">
                        <div className="text-lg sm:text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white truncate">
                            {value}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                            <span
                                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono ${
                                    isPositive
                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60'
                                        : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/60'
                                }`}
                            >
                                {isPositive ? (
                                    <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                                ) : (
                                    <TrendingDown className="w-2.5 h-2.5 shrink-0" />
                                )}
                                <span>{Number(percentage || 0).toFixed(1)}%</span>
                            </span>

                            {comparisonRange && (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate">
                                    {comparisonRange}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1 text-[10.5px] text-slate-500 dark:text-slate-400">
                        <span className="truncate">Prev:</span>
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate">
                            {previousValue}
                        </span>
                    </div>
                </>
            )}
        </div>
    );
};

// Admin Edit Modal for Reports
const EditSaleModal = ({ sale, isOpen, onClose }) => {
    const updateSaleMutation = useUpdateSale();

    const [status, setStatus] = useState(sale?.status || 'Completed');
    const [paymentMethod, setPaymentMethod] = useState(sale?.paymentMethod || 'Cash');
    const [customerName, setCustomerName] = useState(sale?.customerName || '');
    const [amountReceived, setAmountReceived] = useState(String(sale?.amountReceived || sale?.totalAmount || 0));

    useEffect(() => {
        if (sale) {
            setStatus(sale.status || 'Completed');
            setPaymentMethod(sale.paymentMethod || 'Cash');
            setCustomerName(sale.customerName || '');
            setAmountReceived(String(sale.amountReceived || sale.totalAmount || 0));
        }
    }, [sale]);

    if (!sale) return null;

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
            <DialogContent className="p-0 sm:max-w-md w-[95vw] sm:w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl dark:[color-scheme:dark] transition-colors">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center">
                            <Pencil className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>Edit Transaction #{sale.id}</span>
                    </DialogTitle>
                    <DialogCloseButton onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Amount:</span>
                            <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(sale.totalAmount)}</span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Name</Label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</Label>
                                <Select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-[#8DB600] cursor-pointer"
                                >
                                    <option value="Cash" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cash</option>
                                    <option value="GCash" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">GCash</option>
                                    <option value="Charge" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Charge (Utang)</option>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</Label>
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:border-[#8DB600] cursor-pointer"
                                >
                                    <option value="Completed" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Completed</option>
                                    <option value="Unpaid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Unpaid</option>
                                    <option value="Pending" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Pending</option>
                                    <option value="Cancelled" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">Cancelled</option>
                                </Select>
                            </div>
                        </div>

                        {paymentMethod === 'Cash' && (
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Amount Received (₱)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={amountReceived}
                                    onChange={(e) => setAmountReceived(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600]"
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5">
                        <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={updateSaleMutation.isPending}
                            className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md cursor-pointer active:scale-95 transition-all"
                        >
                            {updateSaleMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

// Single & Bulk Delete Confirmation Modal
const BulkDeleteSalesModal = ({ salesToDelete = [], isOpen, onClose, onConfirm, isDeleting }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    if (!isOpen || !salesToDelete.length) return null;

    const count = salesToDelete.length;
    const totalAmount = salesToDelete.reduce((sum, s) => sum + (Number(s.totalAmount || s.totalamount) || 0), 0);

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(reason.trim());
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 sm:max-w-md w-[95vw] sm:w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl">
                <div className="px-6 py-4 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-rose-900 dark:text-rose-200 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex items-center justify-center">
                            <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>
                            {count === 1 ? `Delete Transaction #${salesToDelete[0].id}` : `Delete ${count} Transactions`}
                        </span>
                    </DialogTitle>
                    <DialogCloseButton onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6 space-y-4">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Transactions Selected:</span>
                                <span className="font-black text-slate-900 dark:text-white">{count}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-slate-400 font-semibold">Combined Amount:</span>
                                <span className="font-black font-mono text-rose-600 dark:text-rose-400">
                                    {formatCurrency(totalAmount)}
                                </span>
                            </div>
                            {count <= 6 && (
                                <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                    Customers: {salesToDelete.map(s => s.customerName || 'Walk-in').join(', ')}
                                </div>
                            )}
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            This action will permanently remove {count === 1 ? 'this transaction' : 'these transactions'}, restore tracked product inventory, and reverse any unpaid Charge/Utang balances.
                        </p>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Reason for Deletion (Optional)
                            </Label>
                            <Input
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="e.g. Duplicate scan entry, test order..."
                                className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-2.5">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isDeleting}
                            className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isDeleting}
                            className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{isDeleting ? 'Deleting...' : `Delete ${count === 1 ? 'Transaction' : `${count} Transactions`}`}</span>
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

const ReportPage = () => {
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();

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

    // Multi-Select & Modals State
    const [selectedSaleIds, setSelectedSaleIds] = useState([]);
    const [salesToDelete, setSalesToDelete] = useState([]);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSale, setEditingSale] = useState(null);

    const weeklyGrowthDate = useMemo(() => toDate ? new Date(`${toDate}T12:00:00+08:00`) : new Date(), [toDate]);
    const { data: weeklyGrowthData, isLoading: isWeeklyGrowthLoading } = useWeeklyGrowth(weeklyGrowthDate);
    const { data: monthlyGrowthData, isLoading: isMonthlyGrowthLoading } = useMonthlyGrowth(weeklyGrowthDate);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab === 'frequent' || tab === 'inactive' || tab === 'sales') {
            setActiveTab(tab);
        }
    }, [searchParams]);

    useEffect(() => {
        const onScroll = () => setElevated(window.scrollY > 8);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Clear selection when filters or active tab change
    useEffect(() => {
        setSelectedSaleIds([]);
    }, [fromDate, toDate, selectedProductId, debouncedCustomerSearch, activeTab]);

    // Explicit Asia/Manila (+08:00) date boundaries
    const interval = useMemo(() => {
        const start = fromDate ? new Date(`${fromDate}T00:00:00+08:00`) : null;
        const end = toDate ? new Date(`${toDate}T23:59:59.999+08:00`) : null;

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
            const lastDay = new Date(Number(year), Number(month), 0).getDate();
            const paddedMonth = String(month).padStart(2, '0');
            const paddedLastDay = String(lastDay).padStart(2, '0');

            // Explicit Asia/Manila (+08:00) boundaries
            const startDate = new Date(`${year}-${paddedMonth}-01T00:00:00+08:00`).toISOString();
            const endDate = new Date(`${year}-${paddedMonth}-${paddedLastDay}T23:59:59.999+08:00`).toISOString();

            const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const weekEndStr = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
            const weekStartIso = new Date(`${weekStartStr}T00:00:00+08:00`).toISOString();
            const weekEndIso = new Date(`${weekEndStr}T23:59:59.999+08:00`).toISOString();

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

    // Bulk & Single Delete Mutation (Restocks inventory + reverses Charge/Utang + deletes sale_items & sales)
    const bulkDeleteMutation = useMutation({
        mutationFn: async ({ targetSales, reason }) => {
            if (!targetSales || targetSales.length === 0) return 0;

            const saleIds = targetSales.map((s) => s.id);
            const totalDeletedAmount = targetSales.reduce((sum, s) => sum + (Number(s.totalAmount || s.totalamount) || 0), 0);

            // 1. Fetch all sale_items for these sales to restock inventory accurately
            const { data: itemsToRestock } = await supabase
                .from('sale_items')
                .select('sale_id, product_id, quantity')
                .in('sale_id', saleIds);

            if (Array.isArray(itemsToRestock) && itemsToRestock.length > 0) {
                const restockMap = {};
                itemsToRestock.forEach((item) => {
                    if (item.product_id && Number(item.quantity) > 0) {
                        restockMap[item.product_id] = (restockMap[item.product_id] || 0) + Number(item.quantity);
                    }
                });

                for (const [prodIdStr, qtyToAdd] of Object.entries(restockMap)) {
                    const prodId = Number(prodIdStr);
                    const { data: prod } = await supabase
                        .from('products')
                        .select('*')
                        .eq('id', prodId)
                        .single();

                    if (prod && prod.track_stock !== false) {
                        const stockField = ['stock_quantity', 'stock', 'quantity', 'inventory', 'current_stock'].find(
                            (field) => prod[field] !== undefined && prod[field] !== null
                        );
                        if (stockField) {
                            await supabase
                                .from('products')
                                .update({ [stockField]: Number(prod[stockField]) + qtyToAdd })
                                .eq('id', prodId);
                        }
                    }
                }
            }

            // 2. Reverse Charge / Utang balances
            const chargeSales = targetSales.filter(
                (s) => s.paymentMethod === 'Charge' || s.paymentMethod === 'Credit' || s.paymentmethod === 'Charge' || s.paymentmethod === 'Credit'
            );

            if (chargeSales.length > 0) {
                const chargeSaleIds = chargeSales.map((s) => s.id);
                await supabase
                    .from('customer_debts')
                    .delete()
                    .in('sale_id', chargeSaleIds);

                const debtDeductions = {};
                chargeSales.forEach((s) => {
                    const cId = s.customerId || s.customerid;
                    if (cId) {
                        debtDeductions[cId] = (debtDeductions[cId] || 0) + (Number(s.totalAmount || s.totalamount) || 0);
                    }
                });

                for (const [custIdStr, deductAmt] of Object.entries(debtDeductions)) {
                    const custId = Number(custIdStr);
                    const { data: cust } = await supabase
                        .from('customers')
                        .select('credit_balance')
                        .eq('id', custId)
                        .single();

                    if (cust) {
                        const newBal = Math.max(0, Number(cust.credit_balance || 0) - deductAmt);
                        await supabase
                            .from('customers')
                            .update({ credit_balance: newBal })
                            .eq('id', custId);
                    }
                }
            }

            // 3. Delete child sale_items first, then parent sales
            const { error: itemsErr } = await supabase
                .from('sale_items')
                .delete()
                .in('sale_id', saleIds);

            if (itemsErr) throw itemsErr;

            const { error: salesErr } = await supabase
                .from('sales')
                .delete()
                .in('id', saleIds);

            if (salesErr) throw salesErr;

            // 4. Audit Log
            const reasonSuffix = reason ? ` — Reason: ${reason}` : '';
            logActivity({
                user,
                action: saleIds.length > 1 ? 'BULK_DELETE_SALES' : 'DELETE_SALE',
                entity_type: 'SALE',
                description: `Admin ${user?.name || 'Admin'} deleted ${saleIds.length} transaction(s) (Total: ₱${totalDeletedAmount.toFixed(2)})${reasonSuffix}`
            });

            return saleIds.length;
        },
        onSuccess: (deletedCount) => {
            setSelectedSaleIds([]);
            setIsDeleteModalOpen(false);
            setSalesToDelete([]);

            queryClient.invalidateQueries({ queryKey: ['sales'] });
            queryClient.invalidateQueries({ queryKey: ['sales-summary'] });
            queryClient.invalidateQueries({ queryKey: ['daily-sales'] });
            queryClient.invalidateQueries({ queryKey: ['weekly-growth'] });
            queryClient.invalidateQueries({ queryKey: ['monthly-growth'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            queryClient.invalidateQueries({ queryKey: ['customer_debts'] });
            queryClient.invalidateQueries({ queryKey: ['customer-stats'] });

            addToast({
                title: deletedCount > 1 ? 'Transactions Deleted' : 'Transaction Deleted',
                description: `Successfully removed ${deletedCount} transaction(s) and synchronized inventory.`,
                variant: 'success'
            });
        },
        onError: (err) => {
            addToast({
                title: 'Deletion Failed',
                description: err.message || 'Could not delete selected transactions.',
                variant: 'destructive'
            });
        }
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

    // Multi-Select Handlers
    const handleToggleSelectSale = (saleId) => {
        setSelectedSaleIds((prev) =>
            prev.includes(saleId) ? prev.filter((id) => id !== saleId) : [...prev, saleId]
        );
    };

    const handleSelectAllDay = () => {
        const dayIds = processedSales.map((s) => s.id);
        const allSelected = dayIds.length > 0 && dayIds.every((id) => selectedSaleIds.includes(id));
        if (allSelected) {
            setSelectedSaleIds((prev) => prev.filter((id) => !dayIds.includes(id)));
        } else {
            setSelectedSaleIds((prev) => Array.from(new Set([...prev, ...dayIds])));
        }
    };

    const handleClearSelection = () => {
        setSelectedSaleIds([]);
    };

    const openDeleteModal = (saleOrId) => {
        const saleObj = typeof saleOrId === 'object'
            ? saleOrId
            : allSales.find((s) => s.id === saleOrId) || { id: saleOrId, totalAmount: 0 };
        setSalesToDelete([saleObj]);
        setIsDeleteModalOpen(true);
    };

    const openBulkDeleteModal = () => {
        const selectedObjects = allSales.filter((s) => selectedSaleIds.includes(s.id));
        if (selectedObjects.length === 0) return;
        setSalesToDelete(selectedObjects);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setSalesToDelete([]);
    };

    const handleConfirmDelete = (reason) => {
        if (salesToDelete.length > 0) {
            bulkDeleteMutation.mutate({ targetSales: salesToDelete, reason });
        }
    };

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

    const openEditModal = (sale) => {
        setEditingSale(sale);
    };

    const closeEditModal = () => {
        setEditingSale(null);
    };

    const monthComparisonRange = monthlyGrowthData?.thisMonthStart && monthlyGrowthData?.lastMonthStart
        ? `${format(new Date(monthlyGrowthData.thisMonthStart), 'MMM d')}–${format(new Date(monthlyGrowthData.thisMonthEnd), 'd')} vs ${format(new Date(monthlyGrowthData.lastMonthStart), 'MMM d')}–${format(new Date(monthlyGrowthData.lastMonthEnd), 'd')}`
        : undefined;

    const weekComparisonRange = weeklyGrowthData?.thisWeekStart && weeklyGrowthData?.lastWeekStart
        ? `${format(new Date(weeklyGrowthData.thisWeekStart), 'MMM d')}–${format(new Date(weeklyGrowthData.thisWeekEnd), 'd')} vs ${format(new Date(weeklyGrowthData.lastWeekStart), 'MMM d')}–${format(new Date(weeklyGrowthData.lastWeekEnd), 'd')}`
        : undefined;

    return (
        <div className="report-page w-full max-w-7xl mx-auto px-1.5 pt-2 pb-32 sm:px-6 sm:pt-6 sm:pb-32 md:pb-8 space-y-3 sm:space-y-5 transition-colors">
            {/* Ensure full mobile bottom dock clearance (< 768px) & edge-to-edge fit (< 640px) */}
            <style jsx global>{`
                @media (max-width: 767px) {
                    .app:has(.report-page) .main,
                    .app:has(.report-page) .container {
                        padding-bottom: calc(7.5rem + env(safe-area-inset-bottom, 0px)) !important;
                    }
                }
                @media (max-width: 639px) {
                    .app:has(.report-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.report-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
                .report-page input[class*="pl-9"],
                .report-page input[class*="pl-10"] {
                    padding-left: 2.5rem !important;
                }
            `}</style>

            {/* Executive Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-0.5 sm:px-0">
                <div className="flex items-start sm:items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#8DB600]/15 border border-[#8DB600]/30 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                            Reports &amp; Analytics
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Revenue performance, gallon volume trends, and customer retention insights.
                        </p>
                    </div>
                </div>

                <div
                    id="tour-report-range"
                    className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                    <Calendar className="w-3.5 h-3.5 text-[#8DB600] shrink-0" />
                    <span className="truncate">{activeRangeLabel}</span>
                </div>
            </div>

            {/* Compact 2x2 Mobile / 4-Column Desktop KPI Grid */}
            <div id="tour-report-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                <ExecutiveKpiCard
                    title="Monthly Sales"
                    isLoading={isMonthlyGrowthLoading}
                    value={formatCurrency(monthlyGrowthData?.thisMonthSales || 0)}
                    previousValue={formatCurrency(monthlyGrowthData?.lastMonthSales || 0)}
                    comparisonRange={monthComparisonRange}
                    percentage={Math.abs(monthlyGrowthData?.salesGrowth || 0)}
                    isPositive={(monthlyGrowthData?.thisMonthSales || 0) >= (monthlyGrowthData?.lastMonthSales || 0)}
                    icon={TrendingUp}
                    accent="lime"
                />

                <ExecutiveKpiCard
                    title="Monthly Volume"
                    isLoading={isMonthlyGrowthLoading}
                    value={`${(monthlyGrowthData?.thisMonthGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(monthlyGrowthData?.lastMonthGallons || 0).toLocaleString()} gal`}
                    comparisonRange={monthComparisonRange}
                    percentage={Math.abs(monthlyGrowthData?.gallonsGrowth || 0)}
                    isPositive={(monthlyGrowthData?.thisMonthGallons || 0) >= (monthlyGrowthData?.lastMonthGallons || 0)}
                    icon={Droplets}
                    accent="cyan"
                />

                <ExecutiveKpiCard
                    title="Weekly Sales"
                    isLoading={isWeeklyGrowthLoading}
                    value={formatCurrency(weeklyGrowthData?.thisWeekSales || 0)}
                    previousValue={formatCurrency(weeklyGrowthData?.lastWeekSales || 0)}
                    comparisonRange={weekComparisonRange}
                    percentage={Math.abs(weeklyGrowthData?.salesGrowth || 0)}
                    isPositive={(weeklyGrowthData?.thisWeekSales || 0) >= (weeklyGrowthData?.lastWeekSales || 0)}
                    icon={BarChart3}
                    accent="emerald"
                />

                <ExecutiveKpiCard
                    title="Weekly Volume"
                    isLoading={isWeeklyGrowthLoading}
                    value={`${(weeklyGrowthData?.thisWeekGallons || 0).toLocaleString()} gal`}
                    previousValue={`${(weeklyGrowthData?.lastWeekGallons || 0).toLocaleString()} gal`}
                    comparisonRange={weekComparisonRange}
                    percentage={Math.abs(weeklyGrowthData?.gallonsGrowth || 0)}
                    isPositive={(weeklyGrowthData?.thisWeekGallons || 0) >= (weeklyGrowthData?.lastWeekGallons || 0)}
                    icon={Droplets}
                    accent="blue"
                />
            </div>

            {/* Segmented Report Domain Switcher */}
            <div
                id="tour-report-tabs"
                className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl w-full sm:w-max border border-slate-200 dark:border-slate-800 shadow-2xs"
            >
                <button
                    type="button"
                    onClick={() => handleTabChange('sales')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'sales'
                            ? 'bg-[#8DB600] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                >
                    <Receipt className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Sales Report</span>
                    <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                            activeTab === 'sales'
                                ? 'bg-black/20 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        {totalSalesCount}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('frequent')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'frequent'
                            ? 'bg-[#8DB600] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                >
                    <Repeat className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Frequent Orders</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleTabChange('inactive')}
                    className={`flex-1 sm:flex-initial px-3 sm:px-4 py-2 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        activeTab === 'inactive'
                            ? 'bg-[#8DB600] text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                >
                    <UserX className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Dropped Off</span>
                </button>
            </div>

            {/* Active Tab View */}
            <div id="tour-report-content">
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
                        selectedSaleIds={selectedSaleIds}
                        onToggleSelectSale={handleToggleSelectSale}
                        onSelectAllDay={handleSelectAllDay}
                        onClearSelection={handleClearSelection}
                        onOpenBulkDelete={openBulkDeleteModal}
                    />
                )}

                {activeTab === 'inactive' && <LapsedCustomersTab enabled={activeTab === 'inactive'} />}
            </div>

            <BulkDeleteSalesModal
                salesToDelete={salesToDelete}
                isOpen={isDeleteModalOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                isDeleting={bulkDeleteMutation.isPending}
            />

            <EditSaleModal
                sale={editingSale}
                isOpen={!!editingSale}
                onClose={closeEditModal}
            />

            <ReportProductTour
                isDataLoading={isLoading}
                isAdmin={isAdmin}
                activeTab={activeTab}
            />
        </div>
    );
};

export default ReportPage;