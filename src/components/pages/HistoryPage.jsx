import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea } from '../ui';

export default function HistoryPage() {
  const sales = useStore(s => s.sales);

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Sales History</h1>
      <Card>
        <CardContent>
          <ScrollArea className="max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.saleTimestamp || s.sale_timestamp || s.created_at || Date.now()).toLocaleString()}</TableCell>
                    <TableCell>{s.customerName || s.customer_name || 'N/A'}</TableCell>
                    <TableCell>₱{(s.totalAmount || s.total_amount || 0).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

