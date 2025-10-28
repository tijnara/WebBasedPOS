import React from 'react';
import { Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, ScrollArea } from '../ui'; // Added ScrollArea
import { useSales } from '../../hooks/useSales'; // Import the useSales hook

export default function HistoryPage() {
    // --- REFACTORED: Get data from useSales hook ---
    const { data: sales = [], isLoading } = useSales(); // Use the hook

    // --- Calculation logic ---
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.amountReceived || 0), 0);
    const transactionsCount = sales.length;
    const avgTransaction = transactionsCount > 0 ? (totalRevenue / transactionsCount).toFixed(2) : '0.00';
    // Calculation for today's sales
    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleTimestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0).toFixed(2);
    // --- End Calculation logic ---

    return (
        <div className="history-page">
            <h1 className="text-2xl font-semibold mb-4">Sales History</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                    <CardHeader><h3 className="font-semibold">Total Revenue</h3></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><h3 className="font-semibold">Transactions</h3></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{transactionsCount}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><h3 className="font-semibold">Avg. Transaction</h3></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{avgTransaction}</div>
                        <div className="text-sm text-muted">Per transaction</div>
                    </CardContent>
                </Card>
            </div>

            {/* Search Input */}
            <div className="mb-4">
                <Input placeholder="Search by customer or transaction ID..." className="w-full max-w-lg" />
            </div>

            {/* Sales Table */}
            <Card>
                <CardContent className="p-0"> {/* Remove padding for full-width table */}
                    {/* Adjust max-height based on your layout */}
                    <ScrollArea className="max-h-[calc(100vh-340px)]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Items</TableHead>
                                    <TableHead>Payment Method</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Total</TableHead> {/* Aligned right */}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* --- REFACTORED: Show loading state --- */}
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted py-8">Loading history...</TableCell>
                                    </TableRow>
                                ) : sales.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted py-8">No sales found.</TableCell>
                                    </TableRow>
                                ) : (
                                    sales.map(sale => (
                                        <TableRow key={sale.id} className="hover:bg-gray-50">
                                            {/* Use a smaller part of the ID, or the full ID if preferred */}
                                            <TableCell className="font-medium">...{String(sale.id).slice(-6)}</TableCell>
                                            <TableCell>{sale.saleTimestamp.toLocaleString()}</TableCell>
                                            <TableCell>{sale.customerName || 'N/A'}</TableCell>
                                            {/* Use the length of the joined 'items' array */}
                                            <TableCell>{sale.items ? sale.items.length : 0} items</TableCell>
                                            <TableCell>{sale.paymentMethod || 'N/A'}</TableCell>
                                            <TableCell>
                                                <span className={`status-badge ${
                                                    sale.status === 'Completed' ? 'status-completed' : 'status-refunded'
                                                }`}>
                                                {sale.status || 'Completed'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">₱{Number(sale.amountReceived || 0).toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}