// src/components/reports/FrequentOrdersTab.jsx
import React from 'react';
import { Input } from '../ui';
import Pagination from '../Pagination';
import { Trophy, Search, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';

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

const FrequentOrdersTab = ({
                               customerSearch,
                               setCustomerSearch,
                               frequentMonth,
                               setFrequentMonth,
                               frequentPage,
                               setFrequentPage,
                               isLoadingFrequent,
                               frequentData,
                               handleFrequentSort,
                               frequentSortCol,
                               frequentSortDesc,
                               FREQUENT_PAGE_SIZE = 10,
                           }) => {
    const customers = frequentData?.customers || [];
    const totalCount = frequentData?.totalCount || 0;
    const totalPages = frequentData?.totalPages || 1;

    const renderRankBadge = (rank) => {
        if (rank === 1) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-black text-xs shadow-2xs">
                    1
                </span>
            );
        }
        if (rank === 2) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 border border-slate-300 font-black text-xs shadow-2xs">
                    2
                </span>
            );
        }
        if (rank === 3) {
            return (
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 border border-orange-200 font-black text-xs shadow-2xs">
                    3
                </span>
            );
        }
        return <span className="font-bold text-slate-400 text-xs pl-1.5">{rank}</span>;
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-5 animate-in fade-in duration-200">
            {/* Header Toolbar */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-lime-100 text-[#5f7d00] flex items-center justify-center shrink-0 shadow-2xs">
                        <Trophy className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <div>
                        <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                            Frequent Customers & Order Leaders
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                            Customers with highest order frequency for the selected calendar month.
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
                    {/* Fixed Search Input */}
                    <div className="relative w-full sm:w-64">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <Input
                            type="text"
                            placeholder="Filter by customer name..."
                            value={customerSearch}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setFrequentPage(1);
                            }}
                            className="h-9 !pl-10 !pr-8 text-xs rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white w-full"
                            style={{ paddingLeft: '2.5rem', paddingRight: customerSearch ? '2rem' : '0.75rem' }}
                        />
                        {customerSearch && (
                            <button
                                type="button"
                                onClick={() => {
                                    setCustomerSearch('');
                                    setFrequentPage(1);
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 transition-colors"
                                title="Clear search"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-1.5">
                        <Input
                            type="month"
                            value={frequentMonth}
                            onChange={(e) => {
                                setFrequentMonth(e.target.value);
                                setFrequentPage(1);
                            }}
                            className="h-9 text-xs rounded-xl bg-slate-50/70 border-slate-200 focus:bg-white font-bold text-slate-700 w-full sm:w-auto"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-slate-100/70 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-3 text-left font-bold text-slate-600 w-20">Rank</th>
                            <th className="px-4 py-3 text-left font-bold text-slate-600">Customer Name</th>
                            <th
                                className="px-4 py-3 text-center font-bold text-slate-600 cursor-pointer hover:bg-slate-200/70 select-none transition-colors w-44"
                                onClick={() => handleFrequentSort('monthly')}
                                title="Click to sort by monthly orders"
                            >
                                <div className="inline-flex items-center gap-1.5">
                                    <span>Monthly Orders</span>
                                    {frequentSortCol === 'monthly' ? (
                                        frequentSortDesc ? (
                                            <ArrowDown className="w-3.5 h-3.5 text-[#5f7d00]" />
                                        ) : (
                                            <ArrowUp className="w-3.5 h-3.5 text-[#5f7d00]" />
                                        )
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="px-4 py-3 text-center font-bold text-slate-600 cursor-pointer hover:bg-slate-200/70 select-none transition-colors w-44"
                                onClick={() => handleFrequentSort('weekly')}
                                title="Click to sort by weekly orders"
                            >
                                <div className="inline-flex items-center gap-1.5">
                                    <span>Orders This Week</span>
                                    {frequentSortCol === 'weekly' ? (
                                        frequentSortDesc ? (
                                            <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
                                        ) : (
                                            <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
                                        )
                                    ) : (
                                        <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />
                                    )}
                                </div>
                            </th>
                        </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">
                        {isLoadingFrequent ? (
                            <tr>
                                <td colSpan="4" className="text-center py-12 text-slate-400 font-semibold">
                                    Loading frequent customers...
                                </td>
                            </tr>
                        ) : customers.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center py-12 text-slate-400 font-semibold">
                                    No customer order records found for this period.
                                </td>
                            </tr>
                        ) : (
                            customers.map((c, idx) => {
                                const rank = (frequentPage - 1) * FREQUENT_PAGE_SIZE + idx + 1;
                                return (
                                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {renderRankBadge(rank)}
                                        </td>
                                        <td className="px-4 py-3 font-bold text-slate-800 text-xs sm:text-sm">
                                            {highlightMatch(c.customername, customerSearch)}
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-lime-100 text-[#5f7d00] border border-lime-200 shadow-2xs">
                                                    {c.monthly_order_count || 0} orders
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 shadow-2xs">
                                                    {c.weekly_order_count || 0} orders
                                                </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pt-2">
                    <span className="text-xs text-slate-500 font-medium">
                        Showing page <strong className="text-slate-800">{frequentPage}</strong> of <strong>{totalPages}</strong> ({totalCount} total customers)
                    </span>
                    <Pagination
                        currentPage={frequentPage}
                        totalPages={totalPages}
                        onPageChange={setFrequentPage}
                    />
                </div>
            )}
        </div>
    );
};

export default FrequentOrdersTab;