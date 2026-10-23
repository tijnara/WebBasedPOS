// src/components/pages/HistoryPage.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSales, useSettleSale, useDeleteSale, useUpdateSale } from '../../hooks/useSales';
import { useProducts } from '../../hooks/useProducts';
import { useDebounce } from '../../hooks/useDebounce';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, Input, Select, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton, Label
} from '../ui';
import Pagination from '../Pagination';

import { format } from 'date-fns';
import currency from 'currency.js';
import { ViewIcon, ReceiptIcon } from '../Icons';
import { Pencil, Trash2, AlertTriangle, ShieldAlert } from 'lucide-react';

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
    let className = 'text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center ';
    switch (status) {
        case 'Completed':
            className += 'bg-lime-50 text-[#5f7d00] border border-lime-200';
            break;
        case 'Pending':
            className += 'bg-amber-50 text-amber-700 border border-amber-200';
            break;
        case 'Cancelled':
            className += 'bg-slate-100 text-slate-600 border border-slate-200';
            break;
        case 'Unpaid':
            className += 'bg-rose-50 text-rose-700 border border-rose-200';
            break;
        default:
            className += 'bg-slate-100 text-slate-700 border border-slate-200';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            <DialogContent className="p-0 sm:max-w-md w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                <div className="p-6 space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                        <AlertTriangle className="w-6 h-6" />
                    </div>

                    <div className="text-center space-y-1">
                        <DialogTitle className="text-lg font-black text-slate-900">Delete Transaction #{sale.id}?</DialogTitle>
                        <p className="text-xs text-slate-500">
                            This action is permanent and restricted to administrators.
                        </p>
                    </div>

                    <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-2">
                        <div className="font-bold flex items-center gap-1.5 text-rose-900">
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <span>Automated Reversal Notice</span>
                        </div>
                        <ul className="list-disc pl-4 space-y-1 text-[11px] text-rose-700">
                            <li>Physical goods sold in this transaction will be returned to stock inventory.</li>
                            {sale.paymentMethod === 'Charge' && (
                                <li>The customer's utang balance will be reduced by {formatCurrency(sale.totalAmount)} and removed from the debt ledger.</li>
                            )}
                            <li>This deletion will be logged in the activity audit trail.</li>
                        </ul>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <Button variant="outline" type="button" onClick={onClose} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200">
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleConfirm}
                        disabled={deleteSaleMutation.isPending}
                        className="h-10 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
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
                className="p-0 bg-white overflow-hidden shadow-2xl rounded-2xl"
                style={{ zIndex: 60, maxWidth: '400px', width: '95vw' }}
            >
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white">
                    <h2 className="text-xl font-bold text-gray-600">Transaction Receipt</h2>
                    <DialogCloseButton onClick={onClose} />
                </div>

                <div className="overflow-y-auto bg-white p-6" style={{ maxHeight: '70vh' }}>
                    <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b-2 border-dashed border-gray-300">
                        <div className="relative h-16 w-16 mb-1 grayscale opacity-90">
                            <img src="/seaside.png" alt="Seaside Logo" className="object-contain w-full h-full" />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-gray-600 tracking-tight uppercase">Seaside Water Refilling Station</h3>
                            <p className="text-xs text-gray-400 mt-1">Laois, Labrador Pangasinan</p>
                            <p className="text-xs text-gray-400">Tel: 09686786072</p>
                        </div>
                    </div>

                    <div className="text-xs text-gray-400 space-y-1 font-mono mt-4">
                        <div className="flex justify-between"><span>Date:</span><span>{formatDate(sale.saleTimestamp)}</span></div>
                        <div className="flex justify-between"><span>Order #:</span><span className="font-bold text-gray-600">{displayId}</span></div>
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
                                        <span className="text-gray-600 font-medium">{item.productName}</span>
                                        <span className="text-gray-600 font-bold font-mono">
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
                        <div className="flex justify-between items-center text-lg font-bold text-gray-600">
                            <span>TOTAL</span><span className="font-mono text-[#8DB600] font-black">{formatCurrency(sale.totalAmount)}</span>
                        </div>
                        <div className="pt-2 space-y-1 text-xs text-gray-400 font-mono">
                            <div className="flex justify-between"><span>Payment Method:</span><span className="uppercase">{sale.paymentMethod}</span></div>
                            {sale.paymentMethod === 'Cash' && (
                                <>
                                    <div className="flex justify-between"><span>Cash Received:</span><span>{formatCurrency(sale.amountReceived || 0)}</span></div>
                                    <div className="flex justify-between font-bold text-gray-600"><span>Change:</span><span>{formatCurrency(sale.changeGiven || 0)}</span></div>
                                </>
                            )}
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                <span>Status:</span><StatusBadge status={sale.status} />
                            </div>
                        </div>
                    </div>

                    <div className="text-center pt-6 pb-2">
                        <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Thank You!</p>
                        <p className="text-[10px] text-gray-400 mt-1">Please keep this receipt for your records.</p>
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto px-4 py-2 text-sm bg-white">Close</Button>
                    <Button variant="primary" onClick={handlePrintReceipt} className="w-full sm:w-auto px-4 py-2 text-sm bg-[#8DB600] hover:bg-[#7ca000] text-white">
                        <ReceiptIcon className="mr-2 h-4 w-4" /> Print Receipt
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

    const interval = useMemo(() => {
        let start = fromDate ? new Date(fromDate) : null;
        if (start) start.setHours(0, 0, 0, 0);

        let end = toDate ? new Date(toDate) : null;
        if (end) end.setHours(23, 59, 59, 999);

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
        <div className="history-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Sales History</h1>
                        <p className="text-xs text-slate-500 mt-0.5">View and manage all completed station transactions</p>
                    </div>
                </div>

                <div className="mb-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <Input
                            ref={searchInputRef}
                            placeholder="Search customer, staff, status..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="h-10 text-xs rounded-xl border-slate-200"
                        />
                        <Select
                            value={productSearch}
                            onChange={e => {
                                setProductSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="h-10 text-xs rounded-xl border-slate-200"
                        >
                            <option value="">All Products</option>
                            {availableProducts.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </Select>
                        <Input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            className="h-10 text-xs rounded-xl border-slate-200"
                        />
                        <Input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            className="h-10 text-xs rounded-xl border-slate-200"
                        />
                    </div>
                    {(searchTerm || productSearch || fromDate || toDate) && (
                        <Button variant="outline" onClick={handleClearFilters} className="text-xs h-9 rounded-xl border-slate-200">
                            Clear Filters
                        </Button>
                    )}
                </div>

                {/* --- DESKTOP TABLE (No Horizontal Scrollbar, Compact Proportional Layout) --- */}
                <Card className="mb-4 hidden md:block border border-slate-200 shadow-sm bg-white overflow-hidden rounded-2xl">
                    <CardContent className="p-0 overflow-hidden">
                        <div className="w-full overflow-hidden">
                            <Table className="w-full table-auto">
                                <TableHeader className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                                    <TableRow>
                                        <TableHead className="py-3 px-3 whitespace-nowrap text-xs">Date & Time</TableHead>
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
                                <TableBody className="divide-y divide-slate-100 text-xs">
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
                                                <TableRow key={s.id} className="hover:bg-slate-50/70 transition-colors">
                                                    <TableCell className="font-medium text-xs whitespace-nowrap py-2.5 px-3">
                                                        {formatDate(s.saleTimestamp)}
                                                    </TableCell>
                                                    <TableCell className="text-[#5f7d00] font-bold py-2.5 px-3 truncate max-w-[130px]" title={s.customerName}>
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
                                                    <TableCell className="py-2.5 px-2 font-medium text-slate-600">
                                                        {s.paymentMethod}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-1 text-center">
                                                        <div className="flex flex-col space-y-0.5 items-center">
                                                            {displayItems.map((item, idx) => (
                                                                <span key={idx} className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[11px] min-w-[20px] text-center">
                                                                    {item.quantity}
                                                                </span>
                                                            ))}
                                                            {remainingCount > 0 && <span className="text-[9px] text-slate-400">+{remainingCount}</span>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-2">
                                                        <div className="flex flex-col space-y-0.5">
                                                            {displayItems.map((item, idx) => (
                                                                <span key={idx} className="font-medium text-slate-600 text-xs">
                                                                    {formatCurrency(item.price_at_sale)}
                                                                </span>
                                                            ))}
                                                            {remainingCount > 0 && (
                                                                <span
                                                                    className="text-[10px] text-blue-600 font-bold cursor-pointer hover:underline"
                                                                    onClick={(e) => { e.stopPropagation(); openModal(s); }}
                                                                >
                                                                    +{remainingCount} more
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-slate-900 py-2.5 px-3 whitespace-nowrap text-xs sm:text-sm">
                                                        {formatCurrency(s.totalAmount)}
                                                    </TableCell>
                                                    <TableCell className="py-2.5 px-3 text-right">
                                                        <div className="flex gap-1 justify-end items-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => openModal(s)}
                                                                className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                                                                title="View Receipt"
                                                            >
                                                                <ViewIcon />
                                                            </button>

                                                            {s.status === 'Unpaid' && (
                                                                <button
                                                                    type="button"
                                                                    className="px-2 py-1 text-[10px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs transition-colors shrink-0"
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
                                                                        className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                                                                        title="Edit Transaction"
                                                                        disabled={isDemo}
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setDeletingSale(s)}
                                                                        className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
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
                        <div className="p-3.5 border-t border-slate-100 flex justify-end">
                            <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                        </div>
                    </CardContent>
                </Card>

                {/* --- MOBILE CARD LIST --- */}
                <div className="block md:hidden">
                    <Card className="border border-slate-200 rounded-2xl shadow-2xs overflow-hidden bg-white">
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-slate-400 p-6 text-xs">Loading sales...</div>
                            ) : sortedSales.length === 0 ? (
                                <div className="text-center text-slate-400 p-6 text-xs">No sales found.</div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {sortedSales.map(s => (
                                        <div key={s.id} className="p-4 flex items-center space-x-3 active:bg-slate-50 transition-colors" onClick={() => openModal(s)}>
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                                                    <ReceiptIcon />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-bold text-[#5f7d00] truncate">{s.customerName}</span>
                                                    <span className="font-black text-slate-900 ml-2">{formatCurrency(s.totalAmount)}</span>
                                                </div>
                                                <div className="text-xs text-slate-400 mt-0.5">{formatDate(s.saleTimestamp)}</div>
                                                <div className="flex justify-between items-center mt-1.5">
                                                    <div className="inline-flex items-center space-x-1.5 text-xs font-semibold" style={{ color: s.userColor }}>
                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.userColor }}></span>
                                                        <span>{s.createdBy || 'N/A'}</span>
                                                    </div>
                                                    <StatusBadge status={s.status} />
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0" onClick={e => e.stopPropagation()}>
                                                <div className="flex flex-col items-end gap-1.5">
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            type="button"
                                                            className="w-7 h-7 flex items-center justify-center text-slate-600 border border-slate-200 rounded-lg"
                                                            onClick={() => openModal(s)}
                                                        >
                                                            <ViewIcon />
                                                        </button>
                                                        {isAdmin && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setEditingSale(s)}
                                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 border border-slate-200 rounded-lg"
                                                                    disabled={isDemo}
                                                                >
                                                                    <Pencil className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDeletingSale(s)}
                                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 border border-slate-200 rounded-lg"
                                                                    disabled={isDemo}
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>

                                                    {s.status === 'Unpaid' && (
                                                        <button
                                                            type="button"
                                                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-2xs"
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