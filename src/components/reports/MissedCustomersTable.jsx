// src/components/reports/MissedCustomersTable.jsx
import React, { useMemo, useState } from 'react';
import { format, subDays, parseISO, isValid } from 'date-fns';
import currency from 'currency.js';
import { useMissedCustomersThisWeek } from '../../hooks/useMissedCustomersThisWeek';
import { UserX, Clock, Phone, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'number' ? amount : currency(amount || 0).value;
    if (isNaN(numericAmount)) return '₱0.00';
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const MissedCustomersTable = ({ startDate, endDate, currentSales = [] }) => {
    const [page, setPage] = useState(1);
    const itemsPerPage = 10;

    const parsedDates = useMemo(() => {
        let start = null;
        let end = null;

        if (startDate) {
            start = typeof startDate === 'string'
                ? (startDate.includes('T') ? parseISO(startDate) : new Date(`${startDate}T00:00:00+08:00`))
                : new Date(startDate);
        }
        if (endDate) {
            end = typeof endDate === 'string'
                ? (endDate.includes('T') ? parseISO(endDate) : new Date(`${endDate}T23:59:59.999+08:00`))
                : new Date(endDate);
        }

        if (!start || !isValid(start)) start = new Date();
        if (!end || !isValid(end)) end = new Date();

        const priorStart = subDays(start, 7);
        const priorEnd = subDays(start, 1);

        const currentPeriodStr = `${format(start, 'MMM d')} – ${format(end, 'MMM d, yyyy')}`;
        const priorPeriodStr = `${format(priorStart, 'MMM d')} – ${format(priorEnd, 'MMM d, yyyy')}`;
        const priorShortStr = `${format(priorStart, 'MMM d')} – ${format(priorEnd, 'MMM d')}`;

        return {
            start,
            end,
            priorStart,
            priorEnd,
            currentPeriodStr,
            priorPeriodStr,
            priorShortStr
        };
    }, [startDate, endDate]);

    const isVisible = Boolean(startDate && endDate);

    const { data, isLoading, error } = useMissedCustomersThisWeek({
        page,
        itemsPerPage,
        enabled: isVisible,
        startDate: parsedDates.start,
        endDate: parsedDates.end,
        currentSales
    });

    if (!isVisible) return null;

    const missedCustomers = data?.customers || [];
    const totalCount = data?.totalCount ?? missedCustomers.length;
    const totalPages = Math.max(1, data?.totalPages ?? Math.ceil(totalCount / itemsPerPage));
    const hasMore = !!data?.hasMore || page < totalPages;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs overflow-hidden mb-6 transition-colors">
            {/* Header */}
            <div className="bg-amber-50/80 dark:bg-amber-950/40 px-4 sm:px-6 py-4 border-b border-amber-100 dark:border-amber-900/60 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                    <UserX className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-200">
                        Needs Attention: Dropped-off Customers
                    </h3>
                    <p className="text-xs text-amber-700/90 dark:text-amber-400 mt-1 leading-relaxed">
                        Customers who ordered in the 7 days prior to this period (
                        <strong className="font-bold underline decoration-amber-400/60">{parsedDates.priorPeriodStr}</strong>
                        ), but did not order during this period (
                        <strong className="font-bold">{parsedDates.currentPeriodStr}</strong>
                        ).
                    </p>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                    <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                        <th className="px-4 sm:px-6 py-3 text-left">Customer Name</th>
                        <th className="px-4 sm:px-6 py-3 text-left">Phone</th>
                        <th className="px-4 sm:px-6 py-3 text-left">Last Recorded Order</th>
                        <th className="px-4 sm:px-6 py-3 text-right">
                            Previous 7 Days Total ({parsedDates.priorShortStr})
                        </th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {isLoading && page === 1 ? (
                        <tr>
                            <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold">
                                Checking customer orders for {parsedDates.currentPeriodStr}...
                            </td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="4" className="text-center py-10 text-rose-500 font-semibold">
                                <div className="flex items-center justify-center gap-1.5">
                                    <AlertCircle className="w-4 h-4" />
                                    <span>Failed to load dropped-off customer records.</span>
                                </div>
                            </td>
                        </tr>
                    ) : missedCustomers.length === 0 ? (
                        <tr>
                            <td colSpan="4" className="text-center py-10 text-slate-400 font-semibold">
                                No dropped-off customers for this period. Everyone who ordered between {parsedDates.priorPeriodStr} reordered!
                            </td>
                        </tr>
                    ) : (
                        missedCustomers.map((customer) => {
                            const customerId = customer.customer_id || customer.id;
                            const customerName = customer.customer_name || customer.name || 'Unknown Customer';
                            const phone = customer.phone || customer.contact;
                            const lastDate = customer.last_order_date || customer.last_seen;
                            const priorTotal = customer.last_week_total ?? customer.prior_total ?? 0;

                            return (
                                <tr key={customerId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-4 sm:px-6 py-3 font-bold text-slate-800 dark:text-slate-100 text-xs sm:text-sm">
                                        {customerName}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 text-slate-500 dark:text-slate-400 font-mono">
                                        {phone && phone !== 'N/A' ? (
                                            <a href={`tel:${phone}`} className="hover:text-[#8DB600] inline-flex items-center gap-1">
                                                <Phone className="w-3 h-3 text-slate-400" />
                                                <span>{phone}</span>
                                            </a>
                                        ) : (
                                            <span className="text-slate-300 dark:text-slate-600">—</span>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                                        {lastDate ? (
                                            <div className="flex items-center gap-1.5">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                <span>{format(new Date(lastDate), 'EEEE, MMM d, yyyy')}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic">No prior date</span>
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-3 text-right font-black font-mono text-slate-800 dark:text-slate-100">
                                        {formatCurrency(priorTotal)}
                                    </td>
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
                <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-200/80 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Showing <strong className="text-slate-800 dark:text-slate-200">{missedCustomers.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalCount}</strong> dropped-off customers
                    </span>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                        </Button>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                            Page {page} {totalPages > 1 ? `of ${totalPages}` : ''}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={!hasMore || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 px-3 rounded-lg border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MissedCustomersTable;