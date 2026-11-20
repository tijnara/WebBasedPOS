// src/components/pages/HistoryPage.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSales, useSettleSale, useDeleteSale, useUpdateSale } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, Input, Select, Dialog, DialogContent,
    DialogTitle, DialogCloseButton, Label
} from '../ui';
import Pagination from '../Pagination';

import { format } from 'date-fns';
import currency from 'currency.js';
import { ViewIcon, ReceiptIcon } from '../Icons';
import { Pencil, Trash2, AlertTriangle, ShieldAlert, X } from 'lucide-react';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const formatDate = (dateString) => {
    try {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
        return 'Invalid Date';
    }
};

const StatusBadge = ({ status }) => {
    let className = 'text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center ';
    switch (status) {
        case 'Completed':
            className += 'bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200 dark:border-lime-800/60';
            break;
        case 'Pending':
            className += 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60';
            break;
        case 'Cancelled':
            className += 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
            break;
        case 'Unpaid':
            className += 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
            break;
        default:
            className += 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
    return <span className={className}>{status}</span>;
};

// Admin Edit Modal
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

    const handleSave = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (!customerName.trim()) return;

        const amt = parseFloat(amountReceived);
        const change = paymentMethod === 'Cash' && amt >= sale.totalAmount ? amt - sale.totalAmount : 0;

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

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 sm:max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl dark:[color-scheme:dark]">
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <DialogTitle className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center">
                            <Pencil className="w-4 h-4 stroke-[2.5]" />
                        </div>
                        <span>Edit Transaction #{sale.id}</span>
                    </DialogTitle>
                    <DialogCloseButton type="button" onClick={onClose} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                </div>

                <div onKeyDown={preventEnterReload}>
                    <div className="p-6 space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400 font-semibold">Total Amount:</span>
                            <span className="text-base font-black text-slate-900 dark:text-slate-100 font-mono">{formatCurrency(sale.totalAmount)}</span>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Customer Name</Label>
                            <Input
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                                required
                                className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Method</Label>
                                <Select
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                                >
                                    <option value="Cash" className="bg-white dark:bg-slate-900">Cash</option>
                                    <option value="GCash" className="bg-white dark:bg-slate-900">GCash</option>
                                    <option value="Charge" className="bg-white dark:bg-slate-900">Charge (Utang)</option>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Status</Label>
                                <Select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                                >
                                    <option value="Completed" className="bg-white dark:bg-slate-900">Completed</option>
                                    <option value="Unpaid" className="bg-white dark:bg-slate-900">Unpaid</option>
                                    <option value="Pending" className="bg-white dark:bg-slate-900">Pending</option>
                                    <option value="Cancelled" className="bg-white dark:bg-slate-900">Cancelled</option>
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
                                    className="h-10 mt-1 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-mono"
                                />
                            </div>
                        )}
                    </div>

                    <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                        <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer">
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSave}
                            disabled={updateSaleMutation.isPending}
                            className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md cursor-pointer"
                        >
                            {updateSaleMutation.isPending ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Admin Delete Confirmation Dialog
const DeleteSaleDialog = ({ sale, isOpen, onClose }) => {
    if (!sale) return null;
    const deleteSaleMutation = useDeleteSale();

    const handleConfirm = async () => {
        await deleteSaleMutation.mutateAsync(sale);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="p-0 sm:max-w-md w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl">
                <div className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div className="text-center space-y-1">
                        <DialogTitle className="text-lg font-black text-slate-900 dark:text-slate-100">Delete Transaction #{sale.id}?</DialogTitle>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            This action is permanent and restricted to administrators.
                        </p>
                    </div>

                    <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-xs text-rose-800 dark:text-rose-300 space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-200">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>Automated Reversal Notice</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700 dark:text-rose-300">
                            <li>Physical goods sold in this transaction will be returned to stock inventory.</li>
                            {sale.paymentMethod === 'Charge' && (
                                <li>The customer&apos;s utang balance will be reduced by {formatCurrency(sale.totalAmount)} and removed from the debt ledger.</li>
                            )}
                            <li>This deletion will be logged in the activity audit trail.</li>
                        </ul>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                    <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={deleteSaleMutation.isPending}
                        className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer"
                    >
                        {deleteSaleMutation.isPending ? 'Deleting...' : 'Confirm Delete'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// Sale Receipt Details Modal
const SaleDetailsModal = ({ sale, isOpen, onClose }) => {
    if (!sale) return null;

    const handlePrintReceipt = () => {
        alert("Printing receipt... (This would connect to a thermal printer)");
    };

    const displayId = sale.id ? String(sale.id).slice(0, 8).toUpperCase() : '---';

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="p-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl rounded-2xl"
                style={{ zIndex: 60, maxWidth: '400px', width: '95vw' }}
            >
                <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/70">
                    <DialogTitle className="text-base font-black text-slate-800 dark:text-slate-100">Transaction Receipt</DialogTitle>
                    <DialogCloseButton type="button" onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer" />
                </div>

                <div className="overflow-y-auto bg-white p-5 sm:p-6" style={{ maxHeight: '70vh' }}>
                    <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b-2 border-dashed border-gray-300">
                        <div className="relative h-14 w-14 mb-1 grayscale opacity-90">
                            <img src="/seaside.png" alt="Seaside Logo" className="object-contain w-full h-full" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-700 tracking-tight uppercase">Seaside Water Refilling Station</h3>
                            <p className="text-xs text-gray-400 mt-1">Laois, Labrador Pangasinan</p>
                            <p className="text-xs text-gray-400">Tel: 09686786072</p>
                        </div>
                    </div>

                    <div className="text-xs text-gray-500 space-y-1 font-mono mt-4">
                        <div className="flex justify-between"><span>Date:</span><span>{formatDate(sale.saleTimestamp)}</span></div>
                        <div className="flex justify-between"><span>Order #:</span><span className="font-bold text-gray-700">{displayId}</span></div>
                        <div className="flex justify-between"><span>Staff:</span><span>{sale.createdBy || 'N/A'}</span></div>
                        <div className="flex justify-between"><span>Customer:</span><span className="font-bold text-[#5f7d00]">{sale.customerName}</span></div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                        <div className="text-xs font-bold text-gray-600 mb-2 uppercase flex justify-between">
                            <span>Item</span><span>Total</span>
                        </div>
                        <div className="space-y-3">
                            {(sale.sale_items || []).map((item, idx) => (
                                <div key={idx} className="text-sm">
                                    <div className="flex justify-between items-start">
                                        <span className="text-gray-700 font-medium">{item.productName}</span>
                                        <span className="text-gray-700 font-bold font-mono">
                                            {formatCurrency((item.price_at_sale || 0) * item.quantity)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-400 font-mono mt-0.5">
                                        {item.quantity} x {formatCurrency(item.price_at_sale)}
                                        {item.discount_amount > 0 && (
                                            <span className="text-[#5f7d00] ml-1 italic">(Disc: -{formatCurrency(item.discount_amount)})</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4 space-y-2">
                        <div className="flex justify-between items-center text-lg font-bold text-gray-700">
                            <span>TOTAL</span><span className="font-mono text-[#8DB600] font-black">{formatCurrency(sale.totalAmount)}</span>
                        </div>
                        <div className="pt-2 space-y-1 text-xs text-gray-500 font-mono">
                            <div className="flex justify-between"><span>Payment Method:</span><span className="uppercase">{sale.paymentMethod}</span></div>
                            {sale.paymentMethod === 'Cash' && (
                                <>
                                    <div className="flex justify-between"><span>Cash Received:</span><span>{formatCurrency(sale.amountReceived || 0)}</span></div>
                                    <div className="flex justify-between font-bold text-gray-700"><span>Change:</span><span>{formatCurrency(sale.changeGiven || 0)}</span></div>
                                </>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                <span>Status:</span><StatusBadge status={sale.status} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-5 pb-1">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Thank You!</p>
                        <p className="text-[10px] text-gray-400 mt-1">Please keep this receipt for your records.</p>
                    </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex justify-end gap-2.5">
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer">
                        Close
                    </Button>
                    <Button type="button" variant="primary" onClick={handlePrintReceipt} className="flex-1 sm:flex-initial px-4 py-2 text-xs font-bold bg-[#8DB600] hover:bg-[#7ca000] text-white cursor-pointer">
                        <ReceiptIcon className="mr-1.5 h-4 w-4" /> Print Receipt
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function HistoryPage() {
    const { user } = useStore();
    const isDemo = user?.isDemo;

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

    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    const [productSearch, setProductSearch] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    const { data: allProductsData } = useProducts({ fetchAll: true });
    const availableProducts = allProductsData?.products || [];

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    // Reset pagination when search or dates change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchTerm, fromDate, toDate]);

    // Explicit Asia/Manila (+08:00) date boundaries
    const interval = useMemo(() => {
        const start = fromDate ? new Date(`${fromDate}T00:00:00+08:00`) : null;
        const end = toDate ? new Date(`${toDate}T23:59:59.999+08:00`) : null;

        if (start && end && start > end) return { start: end, end: start };
        return { start, end };
    }, [fromDate, toDate]);

    const { data = { sales: [], totalPages: 1 }, isLoading } = useSales({
        searchTerm: debouncedSearchTerm,
        productId: productSearch,
        startDate: interval.start,
        endDate: interval.end,
        page: currentPage,
        itemsPerPage
    });

    const settleSale = useSettleSale();

    const handleSettle = (sale) => {
        if (window.confirm(`Settle ₱${sale.totalAmount} for ${sale.customerName}?`)) {
            settleSale.mutate({
                saleId: sale.id,
                customerId: sale.customerId,
                amount: sale.totalAmount
            });
        }
    };

    const sales = data.sales;
    const totalPages = data.totalPages;

    const [selectedSale, setSelectedSale] = useState(null);
    const [editingSale, setEditingSale] = useState(null);
    const [deletingSale, setDeletingSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const openModal = (sale) => {
        setSelectedSale(sale);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(() => setSelectedSale(null), 300);
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setProductSearch('');
        setFromDate('');
        setToDate('');
        setCurrentPage(1);
    };

    const sortedSales = [...sales].sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

    return (
        <div className="history-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 space-y-2.5 sm:space-y-6 transition-colors">
            {/* Match POS, Expenses, Dashboard & Report edge-to-edge .container fit on mobile (< 640px) */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.history-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.history-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2.5 sm:mb-5 px-0.5 sm:px-0 gap-2">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Sales History</h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">View and manage all completed station transactions</p>
                    </div>
                </div>

                {/* Compact Filter Bar */}
                <div className="mb-2.5 sm:mb-4 bg-white dark:bg-slate-900 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 items-end">
                        <div className="col-span-2 md:col-span-1">
                            <Input
                                ref={searchInputRef}
                                placeholder="Search customer, staff, status... (/)"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <Select
                                value={productSearch}
                                onChange={e => {
                                    setProductSearch(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 cursor-pointer"
                            >
                                <option value="" className="bg-white dark:bg-slate-900">All Products</option>
                                {availableProducts.map(p => (
                                    <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900">{p.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="col-span-1">
                            <span className="block sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 pl-0.5">From</span>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={e => setFromDate(e.target.value)}
                                className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                            />
                        </div>
                        <div className="col-span-1">
                            <span className="block sm:hidden text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5 pl-0.5">To</span>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={e => setToDate(e.target.value)}
                                className="h-9 sm:h-10 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>
                    {(searchTerm || productSearch || fromDate || toDate) && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClearFilters}
                                className="text-xs h-8 px-3 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                                <span>Clear Filters</span>
                            </Button>
                        </div>
                    )}
                </div>

                {/* --- DESKTOP TABLE --- */}
                <Card className="mb-4 hidden md:block border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900 overflow-hidden rounded-2xl">
                    <CardContent className="p-0 overflow-hidden">
                        <div className="w-full overflow-hidden">
                            <Table className="w-full table-auto">
                                <TableHeader className="bg-slate-50 dark:bg-slate-800/70 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                                    <TableRow>
                                        <TableHead className="py-3 px-3 whitespace-nowrap text-xs">Date &amp; Time</TableHead>
                                        <TableHead className="py-3 px-3 text-xs">Customer</TableHead>
                                        <TableHead className="py-3 px-3 text-xs">Staff</TableHead>
                                        <TableHead className="py-3 px-2 text-xs">Status</TableHead>
                                        <TableHead className="py-3 px-2 text-xs">Payment</TableHead>
                                        <TableHead className="py-3 px-1 text-center text-xs w-12">Qty</TableHead>
                                        <TableHead className="py-3 px-2 text-xs w-20">Price</TableHead>
                                        <TableHead className="py-3 px-3 text-right text-xs">Total</TableHead>
                                        <TableHead className="py-3 px-3 text-right text-xs w-28">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">Loading sales...</TableCell></TableRow>
                                    ) : sortedSales.length === 0 ? (
                                        <TableRow><TableCell colSpan={9} className="text-center py-8 text-slate-400">No sales found.</TableCell></TableRow>
                                    ) : (
                                        sortedSales.map(s => {
                                            const items = s.sale_items || [];
                                            const displayItems = items.slice(0, 2);
                                            const remainingCount = items.length - 2;

                                            return (
                                                <TableRow key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                                    <TableCell className="font-medium text-slate-700 dark:text-slate-300 text-xs whitespace-nowrap py-2.5 px-3">
                                                        {formatDate(s.saleTimestamp)}
                                                    </TableCell>
                                                    <TableCell className="text-[#5f7d00] dark:text-lime-400 font-bold py-2.5 px-3 truncate max-w-[130px]" title={s.customerName}>
                                                        {s.customerName}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 truncate max-w-[130px]">
                                                        <div className="inline-flex items-center space-x-1.5 font-semibold" style={{ color: s.userColor }}>
                                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.userColor }}></span>
                                                            <span className="truncate">{s.createdBy || 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-2">
                                                        <StatusBadge status={s.status} />
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-2 font-medium text-slate-600 dark:text-slate-300">
                                                        {s.paymentMethod}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-1 text-center">
                                                        <div className="flex flex-col space-y-0.5 items-center">
                                                            {displayItems.map((item, idx) => (
                                                                <span key={idx} className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded text-[11px] min-w-[20px] text-center">
                                                                    {item.quantity}
                                                                </span>
                                                            ))}
                                                            {remainingCount > 0 && <span className="text-[9px] text-slate-400">+{remainingCount}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-2">
                                                        <div className="flex flex-col space-y-0.5">
                                                            {displayItems.map((item, idx) => (
                                                                <span key={idx} className="font-medium text-slate-600 dark:text-slate-300 text-xs font-mono">
                                                                    {formatCurrency(item.price_at_sale)}
                                                                </span>
                                                            ))}
                                                            {remainingCount > 0 && (
                                                                <span
                                                                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold cursor-pointer hover:underline"
                                                                    onClick={(e) => { e.stopPropagation(); openModal(s); }}
                                                                >
                                                                    +{remainingCount} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-slate-900 dark:text-slate-100 font-mono py-2.5 px-3 whitespace-nowrap text-xs sm:text-sm">
                                                        {formatCurrency(s.totalAmount)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-right">
                                                        <div className="flex gap-1 justify-end items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => openModal(s)}
                                                                className="w-7 h-7 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                                title="View Receipt"
                                                            >
                                                                <ViewIcon />
                                                            </button>

                                                            {s.status === 'Unpaid' && (
                                                                <button
                                                                    type="button"
                                                                    className="px-2 py-1 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition-colors shrink-0 cursor-pointer"
                                                                    onClick={() => handleSettle(s)}
                                                                >
                                                                    Settle
                                                                </button>
                                                            )}

                                                            {isAdmin && (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setEditingSale(s)}
                                                                        className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                                        title="Edit Transaction"
                                                                        disabled={isDemo}
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingSale(s)}
                                                                        className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                                        title="Delete Transaction & Restock"
                                                                        disabled={isDemo}
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                            <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                        </div>
                    </CardContent>
                </Card>

                {/* --- MOBILE CARD LIST --- */}
                <div className="block md:hidden">
                    <Card className="border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xs overflow-hidden bg-white dark:bg-slate-900">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-slate-400 p-6 text-xs">Loading sales...</div>
                            ) : sortedSales.length === 0 ? (
                                <div className="text-center text-slate-400 p-6 text-xs">No sales found.</div>
                            ) : (
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {sortedSales.map(s => (
                                        <div
                                            key={s.id}
                                            className="p-3 flex items-center gap-2.5 active:bg-slate-50 dark:active:bg-slate-800/60 transition-colors cursor-pointer"
                                            onClick={() => openModal(s)}
                                        >
                                            <div className="flex-shrink-0">
                                                <span className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400">
                                                    <ReceiptIcon />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center gap-2">
                                                    <span className="font-bold text-sm text-[#5f7d00] dark:text-lime-400 truncate">
                                                        {s.customerName}
                                                    </span>
                                                    <span className="font-black text-sm font-mono text-slate-900 dark:text-white shrink-0">
                                                        {formatCurrency(s.totalAmount)}
                                                    </span>
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                                                    <span>{formatDate(s.saleTimestamp)}</span>
                                                    <span>•</span>
                                                    <span className="font-semibold text-slate-600 dark:text-slate-300">{s.paymentMethod}</span>
                                                </div>
                                                <div className="flex justify-between items-center mt-1.5 gap-2">
                                                    <div className="inline-flex items-center space-x-1.5 text-[11px] font-semibold min-w-0" style={{ color: s.userColor }}>
                                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.userColor }}></span>
                                                        <span className="truncate">{s.createdBy || 'N/A'}</span>
                                                    </div>
                                                    <StatusBadge status={s.status} />
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="w-7 h-7 flex items-center justify-center text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                                                            onClick={() => openModal(s)}
                                                            aria-label="View Receipt"
                                                        >
                                                            <ViewIcon />
                                                        </button>
                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingSale(s)}
                                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                                                                    disabled={isDemo}
                                                                    aria-label="Edit Transaction"
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingSale(s)}
                                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer"
                                                                    disabled={isDemo}
                                                                    aria-label="Delete Transaction"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {s.status === 'Unpaid' && (
                                                        <button
                                                            type="button"
                                                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs cursor-pointer"
                                                            onClick={() => handleSettle(s)}
                                                        >
                                                            Settle
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <div className="pt-2">
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </div>
                </div>

                {/* Modals */}
                <SaleDetailsModal sale={selectedSale} isOpen={isModalOpen} onClose={closeModal} />
                <EditSaleModal sale={editingSale} isOpen={!!editingSale} onClose={() => setEditingSale(null)} />
                <DeleteSaleDialog sale={deletingSale} isOpen={!!deletingSale} onClose={() => setDeletingSale(null)} />
            </div>
        </div>
    );
}