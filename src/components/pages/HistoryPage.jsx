import React from 'react';
import { Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, ScrollArea } from '../ui'; // Added ScrollArea
import { useSales } from '../../hooks/useSales'; // Import the useSales hook

export default function HistoryPage() {
    const { data: sales = [], isLoading } = useSales();

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const transactionsCount = sales.length;
    const avgTransaction = transactionsCount > 0 ? (totalRevenue / transactionsCount).toFixed(2) : '0.00';

    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleTimestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0).toFixed(2);

    return (
        <div className="history-page">
            <h1 className="text-2xl font-semibold mb-4">Sales History</h1>

            {/* Summary Cards (Already responsive) */}
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

            {/* Search Input (Already responsive) */}
            <div className="mb-4">
                <Input placeholder="Search by customer or transaction ID..." className="w-full max-w-lg" />
            </div>

            {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
            <Card className="hidden md:block">
                <CardContent className="p-0">
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
                                    <TableHead className="text-right">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
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
                                            <TableCell className="font-medium">...{String(sale.id).slice(-6)}</TableCell>
                                            <TableCell>{sale.saleTimestamp.toLocaleString()}</TableCell>
                                            <TableCell>{sale.customerName || 'N/A'}</TableCell>
                                            <TableCell>{sale.items ? sale.items.length : 0} items</TableCell>
                                            <TableCell>{sale.paymentMethod || 'N/A'}</TableCell>
                                            <TableCell>
                                                <span className={`status-badge ${
                                                    sale.status === 'Completed' ? 'status-completed' : 'status-refunded'
                                                }`}>
                                                {sale.status || 'Completed'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">₱{Number(sale.totalAmount || 0).toFixed(2)}</TableCell>
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
                ) : sales.length === 0 ? (
                    <div className="text-center text-muted py-8">No sales found.</div>
                ) : (
                    sales.map(sale => (
                        <Card key={sale.id}>
                            <CardContent className="p-4">
                                {/* Top row: Customer and Total */}
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-semibold text-lg">{sale.customerName || 'N/A'}</h3>
                                    <span className="font-semibold text-lg text-success">₱{Number(sale.totalAmount || 0).toFixed(2)}</span>
                                </div>
                                {/* Middle row: Date and TXN ID */}
                                <div className="text-sm text-muted mb-3">
                                    <p>{sale.saleTimestamp.toLocaleString()}</p>
                                    <p className="text-xs">ID: ...{String(sale.id).slice(-6)}</p>
                                </div>
                                {/* Bottom row: Details */}
                                <div className="flex justify-between items-center text-sm border-t pt-3">
                                    <span className="text-muted">{sale.items ? sale.items.length : 0} items</span>
                                    <span className="text-muted">{sale.paymentMethod || 'N/A'}</span>
                                    <span className={`status-badge ${
                                        sale.status === 'Completed' ? 'status-completed' : 'status-refunded'
                                    }`}>
                                    {sale.status || 'Completed'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

        </div>
    );
}