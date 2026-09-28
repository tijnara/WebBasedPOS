// src/components/reports/LapsedCustomersTab.jsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input, Button } from '../ui';
import { format, parseISO } from 'date-fns';
import { Search, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

const PAGE_SIZE = 10;

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
                className={`font-semibold text-gray-600 ${align === 'right' ? 'text-right' : ''}`}
            >
                <button
                    type="button"
                    onClick={() => handleSort(key)}
                    aria-label={`Sort by ${label}; currently ${isActive ? sortConfig.direction : 'unsorted'}`}
                    aria-pressed={isActive}
                    className={`flex w-full items-center gap-1 text-left font-semibold text-gray-600 select-none hover:text-gray-900 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${align === 'right' ? 'justify-end text-right' : ''}`}
                >
                    {label}
                    {isActive ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-primary" /> : <ArrowDown className="w-3 h-3 text-primary" />
                    ) : (
                        <ArrowUpDown className="w-3 h-3 text-gray-300" />
                    )}
                </button>
            </TableHead>
        );
    };

    if (!enabled) return null;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-lg p-3 sm:p-5 shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Inactive / Dropped-Off Customers</h3>
                <p className="text-sm text-gray-500 mb-4">
                    Customers registered for more than a month whose last order was over a month ago.
                    Averages are calculated across their entire lifetime order history.
                </p>

                <div className="relative w-full sm:max-w-sm mb-4">
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
                    <div className="overflow-x-auto overscroll-x-contain">
                        <div className="min-w-[640px]">
                            <Table className="!block">
                                <TableHeader>
                                    <TableRow className="bg-gray-50/50">
                                        {renderSortHeader('Customer', 'customer_name')}
                                        {renderSortHeader('Phone', 'customer_phone')}
                                        {renderSortHeader('Registered', 'date_registered')}
                                        {renderSortHeader('Last Order', 'last_order_date')}
                                        {renderSortHeader('Average Refills', 'avg_refills', 'right')}
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
                    </div>
                </div>

                {/* Pagination Controls */}
                {data && data.totalCount > 0 && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4 text-sm bg-white p-3 border rounded-lg shadow-sm">
                        <span className="text-gray-500 font-medium">
                            Showing {data.customers.length} of {data.totalCount} customers
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
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