import React from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Input, Button } from '../ui';

export default function HistoryPage() {
  const sales = useStore(s => s.sales);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2);
  const transactionsCount = sales.length;
  const avgTransaction = (totalRevenue / transactionsCount).toFixed(2);

  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.saleTimestamp);
    const today = new Date();
    return saleDate.toDateString() === today.toDateString();
  }).reduce((sum, sale) => sum + sale.totalAmount, 0).toFixed(2);

  return (
    <div className="history-page">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <Card>
          <CardHeader><h3 className="font-semibold">Total Revenue</h3></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue}</div>
            <div className="text-sm text-green-600">+12.5% from last week</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Transactions</h3></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactionsCount}</div>
            <div className="text-sm text-green-600">3 completed today</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><h3 className="font-semibold">Avg. Transaction</h3></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgTransaction}</div>
            <div className="text-sm">Per transaction</div>
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
              {sales.map(sale => (
                <TableRow key={sale.id}>
                  <TableCell>{sale.id}</TableCell>
                  <TableCell>{new Date(sale.saleTimestamp).toLocaleString()}</TableCell>
                  <TableCell>{sale.customerName}</TableCell>
                  <TableCell>{sale.items ? sale.items.length : 0} items</TableCell> {/* Ensure 'items' is defined */}
                  <TableCell>{sale.paymentMethod || 'N/A'}</TableCell>
                  <TableCell>
                    <span className={`status ${sale.status === 'Completed' ? 'text-green-600' : 'text-red-600'}`}>{sale.status}</span>
                  </TableCell>
                  <TableCell>${sale.totalAmount.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-4">
        <Card>
          <CardContent>
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">Today's Sales</div>
              <div className="text-2xl font-bold text-blue-600">${todaySales}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
