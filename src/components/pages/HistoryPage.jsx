import React from 'react';
// Removed: import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input } from '../ui';

// --- NEW: Import the useSales hook ---
import { useSales } from '../../hooks/useSales';

export default function HistoryPage() {
    // --- REFACTORED: Get data from useSales hook ---
    const { data: sales = [], isLoading } = useSales();

    // --- Calculation logic remains the same ---
    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);
    const transactionsCount = sales.length;
    const avgTransaction = transactionsCount > 0 ? (totalRevenue / transactionsCount).toFixed(2) : '0.00';

    const todaySales = sales.filter(sale => {
        const saleDate = new Date(sale.saleTimestamp);
        const today = new Date();
        return saleDate.toDateString() === today.toDateString();
    }).reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0).toFixed(2);
    // --- End Calculation logic ---

    return (
        <div className="history-page">
            <h1 className="text-2xl font-semibold mb-4">Sales History</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <Card>
                    <CardHeader><h3 className="font-semibold">Total Revenue</h3></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{totalRevenue.toFixed(2)}</div> {/* Changed $ to ₱ */}
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
                        <div className="text-2xl font-bold">₱{avgTransaction}</div> {/* Changed $ to ₱ */}
                        <div className="text-sm text-muted">Per transaction</div>
                    </CardContent>
                </Card>
            </div>

            <div className="mb-4">
                <Input placeholder="Search by customer or transaction ID" className="w-full" />
            </div>

            <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Transaction ID</TableHead>
                                <TableHead>Date & Time</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {/* --- REFACTORED: Show loading state --- */}
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted">Loading history...</TableCell>
                                </TableRow>
                            ) : sales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted">No sales found.</TableCell>
                                </TableRow>
                            ) : (
                                sales.map(sale => (
                                    <TableRow key={sale.id}>
                                        <TableCell>{sale.id.toString().slice(-6)}</TableCell>
                                        <TableCell>{new Date(sale.saleTimestamp).toLocaleString()}</TableCell>
                                        <TableCell>{sale.customerName || 'N/A'}</TableCell>
                                        <TableCell>{sale.items ? sale.items.length : 0} items</TableCell>
                                        <TableCell>{sale.paymentMethod || 'N/A'}</TableCell>
                                        <TableCell>
                                            <span className={`status-badge ${sale.status === 'Completed' ? 'status-completed' : 'status-refunded'}`}>
                                              {sale.status || 'Completed'}
                                            </span>
                                        </TableCell>
                                        <TableCell>₱{Number(sale.totalAmount || 0).toFixed(2)}</TableCell> {/* Changed $ to ₱ */}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}