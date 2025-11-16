import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useSales } from '../../hooks/useSales';
import { useDebounce } from '../../hooks/useDebounce.js';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';
import { format } from 'date-fns';

// --- Helper Functions ---
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

const formatDate = (dateString) => {
    try {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (e) {
        return 'Invalid Date';
    }
}

// --- Modern Icons ---
// View Icon (Eye)
const ViewIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.022 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
    </svg>
);

// Receipt Icon (for Modal Button)
const ReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H5zm3 4a1 1 0 000 2h4a1 1 0 100-2H8zm0 3a1 1 0 100 2h4a1 1 0 100-2H8zm-1 3a1 1 0 102 0v1a1 1 0 102 0v-1a1 1 0 102 0v1a1 1 0 102 0v-1h.5a1 1 0 100-2H7v1z" clipRule="evenodd" />
    </svg>
);

// Receipt Icon (for List Item)
const ListReceiptIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
        <path fillRule="evenodd" d="M5 2a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V4a2 2 0 00-2-2H5zm3 4a1 1 0 000 2h4a1 1 0 100-2H8zm0 3a1 1 0 100 2h4a1 1 0 100-2H8zm-1 3a1 1 0 102 0v1a1 1 0 102 0v-1a1 1 0 102 0v1a1 1 0 102 0v-1h.5a1 1 0 100-2H7v1z" clipRule="evenodd" />
    </svg>
);

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

// --- Sale Details Modal ---
const SaleDetailsModal = ({ sale, isOpen, onClose }) => {
    if (!sale) return null;

    // Note: This function would be for a future "Print" feature
    const handlePrintReceipt = () => {
        alert("Printing receipt... (feature not implemented)");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Sale Details</DialogTitle>
                    <DialogCloseButton onClick={onClose} />
                </DialogHeader>

                <div className="p-4 space-y-4">
                    <div className="text-center">
                        <img src="/seaside.png" alt="Logo" className="mx-auto h-12 w-12" />
                        <h3 className="font-semibold text-lg">Seaside Water Refilling Station</h3>
                        <p className="text-sm text-muted">Transaction Receipt</p>
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Date:</span>
                            <span className="font-medium">{formatDate(sale.saleTimestamp)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Customer:</span>
                            <span className="font-medium">{sale.customerName}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Staff:</span>
                            <span className="font-medium">{sale.createdBy || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Status:</span>
                            <StatusBadge status={sale.status} />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted">Payment:</span>
                            <span className="font-medium">{sale.paymentMethod}</span>
                        </div>
                    </div>

                    <div className="border-t border-dashed pt-2">
                        <h4 className="font-semibold mb-2">Items Purchased</h4>
                        <div className="space-y-1">
                            {(sale.sale_items || []).map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span>{item.productName} (x{item.quantity})</span>
                                    <span>{formatCurrency(item.productPrice * item.quantity)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-dashed pt-2 space-y-1">
                        <div className="flex justify-between text-base font-semibold">
                            <span>Total Amount:</span>
                            <span>{formatCurrency(sale.totalAmount)}</span>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handlePrintReceipt} disabled>
                        <ReceiptIcon /> <span className="ml-2">Print Receipt</span>
                    </Button>
                    <Button variant="primary" onClick={onClose}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

// --- Main History Page Component ---
export default function HistoryPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 300);
    const { data: sales = [], isLoading } = useSales({ searchTerm: debouncedSearchTerm });
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSale, setSelectedSale] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchInputRef = useRef(null);
    const itemsPerPage = 10;

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

    // Remove client-side filtering in useMemo, only paginate and sort
    const paginatedSales = useMemo(() => {
        const sortedSales = sales.sort((a, b) => new Date(b.saleTimestamp) - new Date(a.saleTimestamp));
        const totalPages = Math.max(1, Math.ceil(sortedSales.length / itemsPerPage));
        const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
        if (currentPage !== validCurrentPage) {
            setCurrentPage(validCurrentPage);
        }
        const startIdx = (validCurrentPage - 1) * itemsPerPage;
        const endIdx = startIdx + itemsPerPage;
        return {
            sales: sortedSales.slice(startIdx, endIdx),
            totalPages,
        };
    }, [sales, currentPage]);

    return (
        <div className="history-page">
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
            <MobileLogoutButton />
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
                                    ) : paginatedSales.sales.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center text-muted py-8">No sales found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedSales.sales.map(s => (
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
                        <div className="flex justify-center items-center gap-2 py-4 px-4 rounded-lg bg-white">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                            <span className="text-sm">Page {currentPage} of {paginatedSales.totalPages}</span>
                            <Button variant="outline" size="sm" disabled={currentPage === paginatedSales.totalPages || paginatedSales.totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* --- (MODIFIED) MOBILE CARD LIST (Show on mobile, hide on md+) --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading sales...</div>
                            ) : paginatedSales.sales.length === 0 ? (
                                <div className="text-center text-muted p-6">No sales found.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {paginatedSales.sales.map(s => (
                                        <div key={s.id} className="p-4 flex items-center space-x-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <ListReceiptIcon />
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openModal(s)} title="View Details">
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
                    <div className="flex justify-center items-center gap-2 py-3">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                        <span className="text-sm">Page {currentPage} of {paginatedSales.totalPages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage === paginatedSales.totalPages || paginatedSales.totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                    </div>
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