import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, ScrollArea, cn, Button } from '../ui';
import { useSales } from '../../hooks/useSales';
import MobileLogoutButton from '../MobileLogoutButton';

export default function HistoryPage() {
    // --- Get data from useSales hook ---
    const { data: sales = [], isLoading } = useSales();

    // --- Calculation logic ---
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amountReceived || 0), 0);
    const transactionsCount = sales.length;
    const avgTransaction = transactionsCount > 0 ? (totalRevenue / transactionsCount).toFixed(2) : '0.00';

    // --- State and Refs for Search/Pagination ---
    const [currentPage, setCurrentPage] = useState(1);
    const searchInputRef = useRef(null);
    const itemsPerPage = 10;
    const [searchTerm, setSearchTerm] = useState('');

    // --- Filtering Logic ---
    const filteredSales = sales.filter(sale => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
            (sale.customerName && sale.customerName.toLowerCase().includes(term)) ||
            (sale.id && String(sale.id).toLowerCase().includes(term))
        );
    });

    // --- Pagination Logic (This was missing from your last paste) ---
    const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
    const paginatedSales = filteredSales.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // --- Keyboard Shortcut Effect (Ctrl+F or /) ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) {
                    searchInputRef.current.focus();
                }
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return (
        <div className="history-page">
            {/* --- Brand Logo at the very top left --- */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <h1 className="text-2xl font-semibold mb-4">Sales History</h1>

            {/* --- Summary Cards - Responsive compact layout --- */}
            <div
                className="history-summary-row"
                style={{
                    display: 'flex',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                    flexDirection: 'row',
                }}
            >
                {/* Total Revenue Card */}
                <div
                    className="history-summary-card"
                    style={{
                        flex: 1,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        minWidth: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                    }}
                >
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', width: '100%', fontSize: '1rem' }}><span style={{ fontWeight: 600, color: '#1f2937' }}>Total Revenue</span></div>
                    <div style={{ padding: '0.75rem', fontWeight: 700, fontSize: '1.25rem', color: '#1f2937', wordBreak: 'break-word' }}>₱{totalRevenue.toFixed(2)}</div>
                </div>
                {/* Transactions Card */}
                <div
                    className="history-summary-card"
                    style={{
                        flex: 1,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        minWidth: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                    }}
                >
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', width: '100%', fontSize: '1rem' }}><span style={{ fontWeight: 600, color: '#1f2937' }}>Transactions</span></div>
                    <div style={{ padding: '0.75rem', fontWeight: 700, fontSize: '1.25rem', color: '#1f2937', wordBreak: 'break-word' }}>{transactionsCount}</div>
                </div>
                {/* Avg. Transaction Card */}
                <div
                    className="history-summary-card"
                    style={{
                        flex: 1,
                        background: '#f9fafb',
                        border: '1px solid #e5e7eb',
                        borderRadius: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        minWidth: 0,
                        padding: 0,
                        boxSizing: 'border-box',
                        maxWidth: '100%',
                    }}
                >
                    <div style={{ padding: '0.75rem', borderBottom: '1px solid #e5e7eb', width: '100%', fontSize: '1rem' }}><span style={{ fontWeight: 600, color: '#1f2937' }}>Avg. Transaction</span></div>
                    <div style={{ padding: '0.75rem', fontWeight: 700, fontSize: '1.25rem', color: '#1f2937', wordBreak: 'break-word' }}>₱{avgTransaction}</div>
                    <div style={{ padding: '0 0.75rem 0.75rem 0.75rem', color: '#6b7280', fontSize: '0.85rem', wordBreak: 'break-word' }}>Per transaction</div>
                </div>
            </div>

            {/* --- Inline Styles for Card Responsiveness --- */}
            <style>{`
                @media (max-width: 767px) {
                    .history-summary-row {
                        flex-direction: column !important;
                        gap: 0.5rem !important;
                    }
                    .history-summary-card {
                        font-size: 0.95rem !important;
                        padding: 0 !important;
                        min-width: 0 !important;
                        max-width: 100% !important;
                    }
                    .history-summary-card > div {
                        padding: 0.5rem !important;
                        font-size: 1rem !important;
                    }
                    .history-summary-card > div:last-child {
                        font-size: 0.8rem !important;
                        padding-bottom: 0.5rem !important;
                    }
                }
            `}</style>

            {/* --- Search Input --- */}
            <div className="mb-4">
                <Input
                    ref={searchInputRef}
                    placeholder="Search by customer or transaction ID..."
                    className="w-full max-w-lg"
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1); // Reset to first page on new search
                    }}
                />
            </div>

            {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
                    <ScrollArea className="max-h-[calc(100vh-340px)]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Item</TableHead>
                                    <TableHead>Price</TableHead>
                                    <TableHead>Quantity</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted py-8">Loading sales...</TableCell>
                                    </TableRow>
                                ) : paginatedSales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted py-8">No sales found.</TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedSales.map(sale => (
                                        <TableRow key={sale.id} className="hover:bg-gray-50">
                                            <TableCell>{sale.saleTimestamp ? new Date(sale.saleTimestamp).toLocaleString() : 'N/A'}</TableCell>
                                            <TableCell>{sale.customerName || 'N/A'}</TableCell>
                                            <TableCell>{Array.isArray(sale.sale_items) && sale.sale_items.length > 0 ? sale.sale_items.map(item => item.productName).join(', ') : 'N/A'}</TableCell>
                                            <TableCell>{Array.isArray(sale.sale_items) && sale.sale_items.length > 0 ? sale.sale_items.map(item => `₱${Number(item.productPrice || 0).toFixed(2)}`).join(', ') : 'N/A'}</TableCell>
                                            <TableCell>{Array.isArray(sale.sale_items) ? sale.sale_items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0}</TableCell>
                                            <TableCell>{sale.paymentMethod || 'N/A'}</TableCell>
                                            <TableCell className="text-right font-semibold">₱{Number(sale.amountReceived || 0).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <span className={cn(
                                                    'status-badge',
                                                    sale.status === 'Completed' ? 'status-completed' : 'status-refunded'
                                                )}>
                                                    {sale.status || 'Completed'}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* --- MOBILE CARD LIST (Show on mobile, hide on md+) --- */}
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-muted py-8">Loading history...</div>
                ) : paginatedSales.length === 0 ? (
                    <div className="text-center text-muted py-8">No sales found.</div>
                ) : (
                    paginatedSales.map(sale => (
                        <Card key={sale.id} className="md:hidden">
                            <CardContent className="p-4">
                                {/* Top row: ID and Total */}
                                <div className="flex justify-between items-start mb-2 pb-2 border-b">
                                    <div>
                                        <p className="text-xs text-muted">Transaction ID</p>
                                        <h3 className="font-semibold">...{String(sale.id).slice(-6)}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted">Total</p>
                                        <h3 className="font-bold text-lg text-primary">₱{Number(sale.amountReceived || 0).toFixed(2)}</h3>
                                    </div>
                                </div>
                                {/* Details */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                    <span className="text-muted">Customer:</span>
                                    <span>{sale.customerName || 'N/A'}</span>
                                    <span className="text-muted">Items:</span>
                                    <span>{Array.isArray(sale.sale_items) ? sale.sale_items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0} items</span>
                                    <span className="text-muted">Payment:</span>
                                    <span>{sale.paymentMethod || 'N/A'}</span>
                                    <span className="text-muted">Status:</span>
                                    <span>
                                        <span className={cn('status-badge', sale.status === 'Completed' ? 'status-completed' : 'status-refunded')}>
                                            {sale.status || 'Completed'}
                                        </span>
                                    </span>
                                </div>
                                {/* Timestamp */}
                                <div className="text-xs text-gray-500 mt-3 pt-3 border-t">
                                    {sale.saleTimestamp ? new Date(sale.saleTimestamp).toLocaleString() : 'N/A'}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* --- Pagination Controls --- */}
            <div className="flex justify-center items-center gap-2 py-4 px-4 rounded-lg bg-white">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                >
                    Prev
                </Button>
                <span className="text-sm">Page {currentPage} of {totalPages > 0 ? totalPages : 1}</span>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}