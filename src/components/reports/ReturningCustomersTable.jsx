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
            <div className="p-6 text-center text-sm font-medium text-text-muted">
                No returning customers found for this period.
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* DESKTOP VIEW: Table */}
            <div className="hidden md:block">
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
                                <TableCell className="font-medium text-text">{c.customerName}</TableCell>
                                <TableCell className="text-text-muted whitespace-nowrap">
                                    {c.lastOrderDate ? format(parseISO(c.lastOrderDate), 'MMM d, yyyy') : 'N/A'}
                                </TableCell>
                                <TableCell className="text-text-muted italic text-xs whitespace-nowrap">
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
            </div>

            {/* MOBILE VIEW: Stacked Cards */}
            <div className="block md:hidden divide-y divide-border">
                {paginatedCustomers.map((c, idx) => (
                    <div key={idx} className="p-4 bg-surface hover:bg-emerald-50/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-text text-sm">{c.customerName}</span>
                            <span className="font-bold text-emerald-600 text-sm">
                                {currency(c.currentTotal, { symbol: '₱' }).format()}
                            </span>
                        </div>
                        <div className="flex flex-col gap-1 text-xs">
                            <div className="flex justify-between">
                                <span className="text-text-muted">Order Date:</span>
                                <span className="text-text font-medium">
                                    {c.lastOrderDate ? format(parseISO(c.lastOrderDate), 'MMM d, yyyy') : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-text-muted">Missed Period:</span>
                                <span className="text-text-muted italic">
                                    {c.missedPeriodStart && c.missedPeriodEnd
                                        ? `${format(parseISO(c.missedPeriodStart), 'MMM d')} - ${format(parseISO(c.missedPeriodEnd), 'MMM d, yy')}`
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 p-3 bg-background border-t border-border">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="text-xs font-semibold text-text-muted hover:text-emerald-600 disabled:opacity-30 transition-colors"
                    >
                        Prev
                    </button>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="text-xs font-semibold text-text-muted hover:text-emerald-600 disabled:opacity-30 transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}