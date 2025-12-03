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
        default:
            className += 'bg-gray-100 text-gray-800';
    }
    return <span className={className}>{status}</span>;
};

// --- Sale Details Modal (Fixed UI) ---
const SaleDetailsModal = ({ sale, isOpen, onClose }) => {
    if (!sale) return null;

    const handlePrintReceipt = () => {
        alert("Printing receipt... (feature to be implemented)");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose} className="items-start">
            <DialogContent
                className="p-0 w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col mt-16"
                style={{
                    backgroundColor: 'white',
                    maxHeight: '85vh',
                    height: 'auto',
                }}
            >
                {/* Inner Wrapper to guarantee opacity on all layers */}
                <div className="flex flex-col h-full w-full bg-white" style={{ backgroundColor: 'white' }}>

                    {/* Header - Fixed */}
                    <DialogHeader
                        className="px-6 py-4 border-b bg-white flex-shrink-0 flex justify-between items-center z-10"
                        style={{ backgroundColor: 'white' }}
                    >
                        <DialogTitle className="text-lg font-bold text-gray-900">Transaction Details</DialogTitle>
                        <DialogCloseButton onClick={onClose} />
                    </DialogHeader>

                    {/* Scrollable Body - Flexible */}
                    <div
                        className="flex-1 overflow-y-auto p-6 bg-white relative z-0"
                        style={{
                            backgroundColor: 'white', // Ensure body is opaque
                            minHeight: '200px' // Prevent collapse
                        }}
                    >
                        {/* Content Container - Solid Background */}
                        <div className="bg-white" style={{ backgroundColor: 'white' }}>

                            {/* Branding - Centered */}
                            <div className="flex flex-col items-center text-center mb-6">
                                {/* FIX: Constrained logo container size */}
                                <div className="relative h-20 w-20 mb-3" style={{ height: '80px', width: '80px' }}>
                                    <img
                                        src="/seaside.png"
                                        alt="Seaside Logo"
                                        className="object-contain w-full h-full"
                                        style={{ objectFit: 'contain' }}
                                    />
                                </div>
                                <h3 className="font-bold text-xl text-primary leading-tight">Seaside Water Refilling</h3>
                                <p className="text-xs text-gray-500 mt-1">Loois, Labrador Pangasinan</p>
                            </div>

                            {/* Details Table */}
                            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50 space-y-3 text-sm mb-6">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Date</span>
                                    <span className="font-semibold text-gray-900 text-right">{formatDate(sale.saleTimestamp)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Customer</span>
                                    <span className="font-semibold text-gray-900 text-right">{sale.customerName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Staff</span>
                                    <span className="font-semibold text-gray-900 text-right">{sale.createdBy || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Payment</span>
                                    <span className="font-semibold text-gray-900 text-right">{sale.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-500">Status</span>
                                    <StatusBadge status={sale.status} />
                                </div>
                            </div>

                            {/* Items List */}
                            <div>
                                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 border-b border-dashed border-gray-300 pb-2">
                                    Items Purchased
                                </h4>
                                <div className="space-y-3">
                                    {(sale.sale_items || []).map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-start text-sm">
                                            <div className="flex-1 pr-2">
                                                <div className="font-medium text-gray-800">{item.productName}</div>
                                                <div className="text-xs text-gray-500">{item.quantity} x {formatCurrency(item.productPrice)}</div>
                                            </div>
                                            <div className="font-semibold text-gray-900">
                                                {formatCurrency(item.productPrice * item.quantity)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals Section - Opaque Background */}
                            <div className="mt-6 pt-4 border-t-2 border-dashed border-gray-200 bg-white" style={{ backgroundColor: 'white' }}>
                                {/* Use standard tailwind bg color instead of custom variable to ensure opacity */}
                                <div className="flex justify-between items-end bg-purple-50 p-4 rounded-lg border border-purple-100">
                                    <div>
                                        <p className="text-xs text-purple-600 font-semibold uppercase tracking-wide">Total Amount</p>
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                        {formatCurrency(sale.totalAmount)}
                                    </div>
                                </div>
                                {sale.paymentMethod === 'Cash' && (
                                    <div className="mt-3 flex justify-between text-xs text-gray-500 px-2">
                                        <span>Cash Received: {formatCurrency(sale.amountReceived || sale.totalAmount)}</span>
                                        <span>Change: {formatCurrency((sale.amountReceived || sale.totalAmount) - sale.totalAmount)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer - Fixed */}
                    <DialogFooter
                        className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10"
                        style={{ backgroundColor: '#f9fafb' }}
                    >
                        <div className="flex w-full gap-3">
                            <Button variant="outline" onClick={handlePrintReceipt} className="flex-1 border-gray-300 text-gray-700 bg-white">
                                <ReceiptIcon /> <span className="ml-2">Print</span>
                            </Button>
                            <Button variant="primary" onClick={onClose} className="flex-1 btn--primary">
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

// --- Main History Page Component ---
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
        setTimeout(() => setSelectedSale(null), 300); // Delay for animation
    };

    // Sort sales by date descending
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

                {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
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
                                        <TableHead>Total</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted py-8">Loading sales...</TableCell>
                                        </TableRow>
                                    ) : sortedSales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted py-8">No sales found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        sortedSales.map(s => (
                                            <TableRow key={s.id}>
                                                <TableCell className="font-medium">{formatDate(s.saleTimestamp)}</TableCell>
                                                <TableCell>{s.customerName}</TableCell>
                                                <TableCell>{s.createdBy || 'N/A'}</TableCell>
                                                <TableCell><StatusBadge status={s.status} /></TableCell>
                                                <TableCell>{s.paymentMethod}</TableCell>
                                                <TableCell>{formatCurrency(s.totalAmount)}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => openModal(s)} title="View Details">
                                                        <ViewIcon />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>

                        {/* Pagination Controls */}
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
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <ReceiptIcon className="text-gray-500" />
                                                </span>
                                            </div>

                                            {/* Sale Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-900 truncate">{s.customerName}</span>
                                                    <span className="font-semibold text-gray-900 ml-2">{formatCurrency(s.totalAmount)}</span>
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {formatDate(s.saleTimestamp)}
                                                </div>
                                                <div className="flex justify-between items-center mt-1">
                                                    <span className="text-xs text-gray-500">
                                                        Staff: {s.createdBy || 'N/A'}
                                                    </span>
                                                    <StatusBadge status={s.status} />
                                                </div>
                                            </div>

                                            {/* Action Button */}
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

                    {/* Pagination Controls for mobile */}
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                {/* --- Sale Details Modal --- */}
                <SaleDetailsModal
                    sale={selectedSale}
                    isOpen={isModalOpen}
                    onClose={closeModal}
                />
            </div>
        </div>
    );
}