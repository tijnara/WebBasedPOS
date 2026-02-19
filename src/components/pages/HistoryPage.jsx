// src/components/pages/HistoryPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useSales } from '../../hooks/useSales';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';
import Pagination from '../Pagination';

import { format } from 'date-fns';
import currency from 'currency.js';

import { ViewIcon, ReceiptIcon } from '../Icons';

// --- Helper Functions ---
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
    } catch (e) {
        return 'Invalid Date';
    }
}

// --- Status Badge Component ---
const StatusBadge = ({ status }) => {
    let className = 'px-2 py-0.5 rounded-full text-xs font-medium ';
    switch (status) {
        case 'Completed':
            className += 'bg-green-100 text-green-800';
            break;
        case 'Pending':
            className += 'bg-yellow-100 text-yellow-800';
            break;
        case 'Cancelled':
            className += 'bg-red-100 text-red-800';
            break;
        case 'Unpaid':
            className += 'bg-orange-100 text-orange-800';
            break;
        default:
            className += 'bg-gray-100 text-gray-800';
    }
    return <span className={className}>{status}</span>;
};

// --- Sale Details Modal (Fixed: 100% Scroll Lock) ---
const SaleDetailsModal = ({ sale, isOpen, onClose }) => {

    // FIX: Lock BOTH html and body to ensure main scrollbar disappears
    useEffect(() => {
        if (isOpen) {
            document.documentElement.style.overflow = 'hidden'; // Lock html
            document.body.style.overflow = 'hidden';            // Lock body
        } else {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            document.documentElement.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!sale) return null;

    const handlePrintReceipt = () => {
        alert("Printing receipt... (This would connect to a thermal printer)");
    };

    // Safely handle ID
    const displayId = sale.id ? String(sale.id).slice(0, 8).toUpperCase() : '---';

    return (
        <Dialog
            open={isOpen}
            onOpenChange={onClose}
            // FIX: Force overflow-hidden on the backdrop wrapper to prevent double scrolling
            className="!overflow-hidden flex items-center justify-center"
        >
            <DialogContent
                className="p-0 overflow-hidden w-full sm:max-w-sm shadow-2xl border border-gray-200 rounded-lg flex flex-col"
                style={{
                    backgroundColor: '#ffffff', // Force solid white
                    zIndex: 60,
                    maxHeight: '90vh', // Prevent growing taller than screen
                    margin: '0 auto'
                }}
            >
                {/* Inner Container */}
                <div className="flex flex-col h-full w-full relative" style={{ backgroundColor: '#ffffff' }}>

                    {/* Header */}
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100 bg-white">
                        <h3 className="font-bold text-gray-900">Transaction Receipt</h3>
                        <DialogCloseButton onClick={onClose} />
                    </div>

                    {/* Scrollable Receipt Body - This is the ONLY scrollable area */}
                    <div
                        className="flex-1 overflow-y-auto px-6 py-6 bg-white"
                        style={{ backgroundColor: '#ffffff' }}
                    >
                        {/* 1. Brand Header */}
                        <div className="flex flex-col items-center text-center space-y-2 pb-4 border-b-2 border-dashed border-gray-300">
                            <div className="relative h-16 w-16 mb-1 grayscale opacity-90">
                                <img src="/seaside.png" alt="Seaside Logo" className="object-contain w-full h-full" />
                            </div>
                            <div>
                                <h3 className="font-bold text-xl text-gray-900 tracking-tight uppercase">Seaside Water</h3>
                                <p className="text-xs text-gray-500 mt-1">Loois, Labrador Pangasinan</p>
                                <p className="text-xs text-gray-500">Tel: 09686786072</p>
                            </div>
                        </div>

                        {/* 2. Transaction Meta */}
                        <div className="text-xs text-gray-600 space-y-1 font-mono mt-4">
                            <div className="flex justify-between">
                                <span>Date:</span>
                                <span>{formatDate(sale.saleTimestamp)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Order #:</span>
                                <span className="font-bold text-gray-900">{displayId}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Staff:</span>
                                <span>{sale.createdBy || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Customer:</span>
                                <span className="font-bold">{sale.customerName}</span>
                            </div>
                        </div>

                        {/* 3. Items Table */}
                        <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4">
                            <div className="text-xs font-bold text-gray-900 mb-2 uppercase flex justify-between">
                                <span>Item</span>
                                <span>Total</span>
                            </div>
                            <div className="space-y-3">
                                {(sale.sale_items || []).map((item, idx) => (
                                    <div key={idx} className="text-sm">
                                        <div className="flex justify-between items-start">
                                            <span className="text-gray-800 font-medium">{item.productName}</span>
                                            <span className="text-gray-900 font-bold font-mono">
                                                {formatCurrency((item.price_at_sale || 0) * item.quantity)}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                            {item.quantity} x {formatCurrency(item.price_at_sale)}
                                            {item.discount_amount > 0 && (
                                                <span className="text-green-600 ml-1 italic">
                                                    (Disc: -{formatCurrency(item.discount_amount)})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* 4. Totals & Payment */}
                        <div className="border-t-2 border-dashed border-gray-300 pt-4 mt-4 space-y-2">
                            <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                                <span>TOTAL</span>
                                <span className="font-mono">{formatCurrency(sale.totalAmount)}</span>
                            </div>

                            <div className="pt-2 space-y-1 text-xs text-gray-600 font-mono">
                                <div className="flex justify-between">
                                    <span>Payment Method:</span>
                                    <span className="uppercase">{sale.paymentMethod}</span>
                                </div>
                                {sale.paymentMethod === 'Cash' && (
                                    <>
                                        <div className="flex justify-between">
                                            <span>Cash Received:</span>
                                            <span>{formatCurrency(sale.amountReceived || 0)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-gray-900">
                                            <span>Change:</span>
                                            <span>{formatCurrency(sale.changegiven || 0)}</span>
                                        </div>
                                    </>
                                )}
                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                    <span>Status:</span>
                                    <StatusBadge status={sale.status} />
                                </div>
                            </div>
                        </div>

                        {/* 5. Footer Message */}
                        <div className="text-center pt-6 pb-2">
                            <p className="text-xs font-medium text-gray-400 uppercase tracking-widest">Thank You!</p>
                            <p className="text-[10px] text-gray-300 mt-1">Please keep this receipt for your records.</p>
                        </div>
                    </div>

                    {/* Actions Footer */}
                    <div className="p-4 bg-gray-50 border-t border-gray-200" style={{ backgroundColor: '#f9fafb' }}>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" onClick={onClose} className="w-full text-xs font-semibold bg-white border-gray-300 text-gray-700">
                                Close
                            </Button>
                            <Button variant="primary" onClick={handlePrintReceipt} className="w-full text-xs font-semibold shadow-sm btn--primary">
                                <ReceiptIcon className="mr-2 h-3.5 w-3.5" /> Print Receipt
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const { data = { sales: [], totalPages: 1 }, isLoading } = useSales({ searchTerm: debouncedSearchTerm, page: currentPage, itemsPerPage });
    const sales = data.sales;
    const totalPages = data.totalPages;
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
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

    const sortedSales = sales.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));

    return (
        <div className="history-page">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />

            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Sales History</h1>
                        <p className="text-muted mt-1">View all completed transactions</p>
                    </div>
                </div>

                <div className="mb-4">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search by customer, staff, status..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs mb-2"
                    />
                </div>

                {/* --- DESKTOP TABLE --- */}
                <Card className="mb-4 hidden md:block">
                    <CardContent className="p-0">
                        <ScrollArea className="max-h-[calc(100vh-280px)]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                    <TableRow>
                                        <TableHead>Date & Time</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Staff</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead className="w-[100px] text-center">Quantity</TableHead>
                                        <TableHead className="w-[150px]">Unit Price (Sold)</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted py-8">Loading sales...</TableCell>
                                        </TableRow>
                                    ) : sortedSales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center text-muted py-8">No sales found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedSales.map(s => {
                                            const items = s.sale_items || [];
                                            const displayItems = items.slice(0, 2);
                                            const remainingCount = items.length - 2;

                                            return (
                                                <TableRow key={s.id}>
                                                    <TableCell className="font-medium text-xs whitespace-nowrap">{formatDate(s.saleTimestamp)}</TableCell>
                                                    <TableCell>{s.customerName}</TableCell>
                                                    <TableCell>{s.createdBy || 'N/A'}</TableCell>
                                                    <TableCell><StatusBadge status={s.status} /></TableCell>
                                                    <TableCell>{s.paymentMethod}</TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col space-y-1 items-center">
                                                            {displayItems.map((item, idx) => (
                                                                <div key={idx} className="text-xs pb-1 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                                                                    <span className="font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                                                                        {item.quantity}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {remainingCount > 0 && <div className="h-[15px]"></div>}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col space-y-1">
                                                            {displayItems.map((item, idx) => (
                                                                <div key={idx} className="text-xs pb-1 border-b border-dashed border-gray-100 last:border-0 last:pb-0">
                                                                    <span className="font-medium text-gray-700 bg-gray-50 px-2 py-0.5 rounded">
                                                                        {formatCurrency(item.price_at_sale)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                            {remainingCount > 0 && (
                                                                <div
                                                                    className="text-[10px] text-blue-500 font-medium cursor-pointer hover:underline mt-1"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openModal(s);
                                                                    }}
                                                                >
                                                                    +{remainingCount} more...
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="font-bold">{formatCurrency(s.totalAmount)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => openModal(s)} title="View Details">
                                                            <ViewIcon />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- MOBILE CARD LIST --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading sales...</div>
                            ) : sortedSales.length === 0 ? (
                                <div className="text-center text-muted p-6">No sales found.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {sortedSales.map(s => (
                                        <div key={s.id} className="p-4 flex items-center space-x-3 active:bg-gray-50 transition-colors" onClick={() => openModal(s)}>
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <ReceiptIcon className="text-gray-500" />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-900 truncate">{s.customerName}</span>
                                                    <span className="font-semibold text-gray-900 ml-2">{formatCurrency(s.totalAmount)}</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(s.saleTimestamp)}
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500">Staff: {s.createdBy || 'N/A'}</span>
                                                    <StatusBadge status={s.status} />
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600">
                                                    <ViewIcon />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                <SaleDetailsModal
                    sale={selectedSale}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            </div>
        </div>
    );
}