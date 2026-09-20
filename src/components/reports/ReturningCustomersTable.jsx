import React, { useState } from 'react';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui';

export default function ReturningCustomersTable({ customers = [] }) {
    const [page, setPage] = useState(1);
    const itemsPerPage = 5;
    const totalPages = Math.ceil(customers.length / itemsPerPage);

    const paginatedCustomers = customers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    if (customers.length === 0) {
        return (
            <div className="p-6 text-center text-sm text-gray-500">
                No returning customers found for this period.
            </div>
        );
    }

    return (
        <div className="w-full">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Customer Name</TableHead>
                        <TableHead>Order Date</TableHead>
                        <TableHead>Missed Period</TableHead>
                        <TableHead className="text-right">This Period Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedCustomers.map((c, idx) => (
                        <TableRow key={idx}>
                            <TableCell className="font-medium text-gray-800">{c.customerName}</TableCell>
                            <TableCell className="text-gray-700 whitespace-nowrap">
                                {c.lastOrderDate ? format(parseISO(c.lastOrderDate), 'MMM d, yyyy') : 'N/A'}
                            </TableCell>
                            <TableCell className="text-gray-500 italic text-xs whitespace-nowrap">
                                {c.missedPeriodStart && c.missedPeriodEnd
                                    ? `${format(parseISO(c.missedPeriodStart), 'MMM d')} - ${format(parseISO(c.missedPeriodEnd), 'MMM d, yyyy')}`
                                    : 'N/A'}
                            </TableCell>
                            <TableCell className="text-right font-bold text-emerald-600">
                                {currency(c.currentTotal, { symbol: '₱' }).format()}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-4 bg-gray-50 border-t border-gray-100">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="text-xs font-semibold text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
                    >
                        Prev
                    </button>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs font-semibold text-gray-500 hover:text-primary disabled:opacity-30 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}