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
            <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Inactive / Dropped-Off Customers</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Customers registered for more than a month whose last order was over a month ago.
                    Averages are calculated across their entire lifetime order history.
                </p>

                <div className="relative max-w-sm mb-4">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search lapsed customers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-50/50">
                                <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                                <TableHead className="font-semibold text-gray-600">Phone</TableHead>
                                <TableHead className="font-semibold text-gray-600">Registered</TableHead>
                                <TableHead className="font-semibold text-gray-600">Last Order</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right">Average Refills</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">Loading data...</TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-red-500">Failed to load customers.</TableCell>
                                </TableRow>
                            ) : data?.customers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">No dropped off customers found.</TableCell>
                                </TableRow>
                            ) : (
                                data.customers.map(c => (
                                    <TableRow key={c.customer_id} className="hover:bg-gray-50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">{c.customer_name}</TableCell>
                                        <TableCell className="text-gray-500">{c.customer_phone || 'N/A'}</TableCell>
                                        <TableCell className="text-gray-500">
                                            {c.date_registered ? format(parseISO(c.date_registered), 'MMM dd, yyyy') : 'N/A'}
                                        </TableCell>
                                        <TableCell>
                                            {c.last_order_date ? (
                                                <span className="text-gray-700">
                                                    {format(parseISO(c.last_order_date), 'MMM dd, yyyy')}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">No orders</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="font-bold text-gray-900">{c.avg_refills} gal</div>
                                            <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
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
                    <div className="flex justify-between items-center mt-4 text-sm bg-white p-3 border rounded-lg shadow-sm">
                        <span className="text-gray-500 font-medium">
                            Showing {data.customers.length} of {data.totalCount} customers
                        </span>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page <= 1 || isLoading}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className="flex items-center gap-1"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                            </Button>
                            <span className="font-bold text-gray-700 px-2">
                                Page {page} of {Math.max(1, data.totalPages)}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= data.totalPages || isLoading}
                                onClick={() => setPage(p => p + 1)}
                                className="flex items-center gap-1"
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