// src/components/reports/LapsedCustomersTab.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input, Button } from '../ui';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown, UserX, X, Clock } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 10;

const highlightMatch = (text = '', query = '') => {
    if (!query.trim() || !text) return text;
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
        regex.test(part) ? (
            <mark key={i} className="bg-lime-200 text-slate-900 rounded-xs px-0.5 font-black">
                {part}
            </mark>
        ) : (
            part
        )
    );
};

export default function LapsedCustomersTab({ enabled }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: 'last_order_date', direction: 'desc' });

    const debouncedSearch = useDebounce(searchTerm, 300);

    // Reset to page 1 on new search or sort change
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, sortConfig]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['lapsed-customers', page, debouncedSearch, sortConfig],
        queryFn: async () => {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
            const cutoffIso = oneMonthAgo.toISOString();

            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data: rpcData, error, count } = await supabase
                .rpc('get_lapsed_customers',
                    {
                        search_term: debouncedSearch || '',
                        cutoff_date: cutoffIso
                    },
                    { count: 'exact' }
                )
                .order(sortConfig.key, { ascending: sortConfig.direction === 'asc', nullsFirst: false })
                .range(from, to);

            if (error) throw error;

            return {
                customers: rpcData || [],
                totalPages: Math.ceil((count || 0) / PAGE_SIZE),
                totalCount: count || 0
            };
        },
        enabled: enabled,
        staleTime: 1000 * 60 * 5
    });

    const handleSort = (key) => {
        setSortConfig((current) => ({
            key,
            direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const renderSortHeader = (label, key, align = 'left') => {
        const isActive = sortConfig.key === key;
        return (
            <TableHead
                className={`font-bold text-slate-600 text-xs ${align === 'right' ? 'text-right' : ''}`}
            >
                <button
                    type="button"
                    onClick={() => handleSort(key)}
                    aria-label={`Sort by ${label}; currently ${isActive ? sortConfig.direction : 'unsorted'}`}
                    className={`flex items-center gap-1.5 font-bold text-slate-600 select-none hover:text-slate-900 transition-colors ${
                        align === 'right' ? 'ml-auto justify-end text-right' : 'text-left'
                    }`}
                >
                    <span>{label}</span>
                    {isActive ? (
                        sortConfig.direction === 'asc' ? (
                            <ArrowUp className="w-3.5 h-3.5 text-[#5f7d00]" />
                        ) : (
                            <ArrowDown className="w-3.5 h-3.5 text-[#5f7d00]" />
                        )
                    ) : (
                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                    )}
                </button>
            </TableHead>
        );
    };

    if (!enabled) return null;

    const customers = data?.customers || [];
    const totalCount = data?.totalCount || 0;
    const totalPages = Math.max(1, data?.totalPages || 1);

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs">
                        <UserX className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            Inactive / Dropped-Off Customers
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Customers registered over a month ago whose last refill order was 30+ days ago.
                        </p>
                    </div>
                </div>

                {/* Fixed Search Input */}
                <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search lapsed customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="h-9 !pl-10 !pr-8 text-xs rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white w-full"
                        style={{ paddingLeft: '2.5rem', paddingRight: searchTerm ? '2rem' : '0.75rem' }}
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                            title="Clear search"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-100/70 border-b border-slate-200">
                                {renderSortHeader('Customer', 'customer_name')}
                                {renderSortHeader('Phone', 'customer_phone')}
                                {renderSortHeader('Registered', 'date_registered')}
                                {renderSortHeader('Last Order', 'last_order_date')}
                                {renderSortHeader('Lifetime Averages', 'avg_refills', 'right')}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-semibold">
                                        Loading dropped-off customers...
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-rose-500 font-semibold">
                                        Failed to load inactive customer data.
                                    </TableCell>
                                </TableRow>
                            ) : customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-400 font-semibold">
                                        No dropped-off customer records found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                customers.map((c) => {
                                    const parsedLastDate = c.last_order_date ? parseISO(c.last_order_date) : null;
                                    const daysAgo = parsedLastDate ? differenceInDays(new Date(), parsedLastDate) : null;

                                    return (
                                        <TableRow key={c.customer_id} className="hover:bg-slate-50/70 transition-colors text-xs">
                                            <td className="px-4 py-3 font-bold text-slate-800 text-xs sm:text-sm">
                                                {highlightMatch(c.customer_name, searchTerm)}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-medium">
                                                {c.customer_phone || <span className="text-slate-300">N/A</span>}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500 font-medium whitespace-nowrap">
                                                {c.date_registered ? format(parseISO(c.date_registered), 'MMM d, yyyy') : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                {parsedLastDate ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-700">
                                                            {format(parsedLastDate, 'MMM d, yyyy')}
                                                        </span>
                                                        {daysAgo !== null && (
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                                                <Clock className="w-2.5 h-2.5" />
                                                                {daysAgo}d inactive
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-slate-400 italic">No orders</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right whitespace-nowrap">
                                                <div className="font-black text-slate-800 text-xs">
                                                    {c.avg_refills} gal / order
                                                </div>
                                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                                    {c.total_orders} total orders
                                                </div>
                                            </td>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
                    <span className="text-xs text-slate-500 font-medium">
                        Showing <strong className="text-slate-800">{customers.length}</strong> of <strong className="text-slate-800">{totalCount}</strong> dropped-off customers
                    </span>
                    <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1 || isLoading}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 mr-1" /> Prev
                        </Button>
                        <span className="text-xs font-bold text-slate-700 px-2">
                            {page} / {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages || isLoading}
                            onClick={() => setPage((p) => p + 1)}
                            className="h-8 px-3 rounded-lg border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold"
                        >
                            Next <ChevronRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}