// src/components/reports/LapsedCustomersTab.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input, Button } from '../ui';
import { format, parseISO } from 'date-fns';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 10;

export default function LapsedCustomersTab({ enabled }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);

    const debouncedSearch = useDebounce(searchTerm, 300);

    // Reset to page 1 on new search
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch]);

    const { data, isLoading, isError } = useQuery({
        queryKey: ['lapsed-customers', page, debouncedSearch],
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

    if (!enabled) return null;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-slate-900 rounded-lg p-5 shadow-sm text-slate-300">
                <h3 className="text-lg font-bold text-white mb-2">Inactive / Dropped-Off Customers</h3>
                <p className="text-sm opacity-80 mb-4">
                    Customers registered for more than a month whose last order was over a month ago.
                    Averages are calculated across their entire lifetime order history.
                </p>

                <div className="relative max-w-sm mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                        type="text"
                        placeholder="Search lapsed customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-500"
                    />
                </div>

                <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-900/50 border-slate-700 hover:bg-slate-900/50">
                                <TableHead className="text-slate-300 font-semibold">Customer</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Phone</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Registered</TableHead>
                                <TableHead className="text-slate-300 font-semibold">Last Order</TableHead>
                                <TableHead className="text-slate-300 font-semibold text-right">Average Refills</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow className="border-slate-700 hover:bg-slate-800">
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">Loading data...</TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow className="border-slate-700 hover:bg-slate-800">
                                    <TableCell colSpan={5} className="text-center py-8 text-red-400">Failed to load customers.</TableCell>
                                </TableRow>
                            ) : data?.customers.length === 0 ? (
                                <TableRow className="border-slate-700 hover:bg-slate-800">
                                    <TableCell colSpan={5} className="text-center py-8 text-slate-400">No dropped off customers found.</TableCell>
                                </TableRow>
                            ) : (
                                data.customers.map(c => (
                                    <TableRow key={c.customer_id} className="border-slate-700 hover:bg-slate-700/50 transition-colors">
                                        <TableCell className="font-medium text-slate-200">{c.customer_name}</TableCell>
                                        <TableCell className="text-slate-400">{c.customer_phone || 'N/A'}</TableCell>
                                        <TableCell className="text-slate-400">
                                            {c.date_registered ? format(parseISO(c.date_registered), 'MMM dd, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {c.last_order_date ? (
                                                <span className="text-slate-300">
                                                    {format(parseISO(c.last_order_date), 'MMM dd, yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-slate-500 italic">No orders</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-slate-200">{c.avg_refills} gal</div>
                                            <div className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                                                ({c.total_orders} total orders)
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination Controls */}
                {data && data.totalCount > 0 && (
                    <div className="flex justify-between items-center mt-4 text-sm">
                        <span className="text-slate-400">
                            Showing {data.customers.length} of {data.totalCount} customers
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                            </Button>
                            <span className="font-bold text-slate-300 px-2">
                                Page {page} of {Math.max(1, data.totalPages)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= data.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                            >
                                Next <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}