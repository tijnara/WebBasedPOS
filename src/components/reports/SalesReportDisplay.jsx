// src/components/reports/SalesReportDisplay.jsx
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import currency from 'currency.js';
import Pagination from '../Pagination';
import SaleCard from './SaleCard';
import { Pencil, Trash2, Calendar } from 'lucide-react';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) return '₱0.00';
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const SalesReportDisplay = ({
                                salesList = [],
                                currentPage,
                                totalPages,
                                onPageChange,
                                onDelete,
                                onEdit,
                                isAdmin,
                                currentDate,
                                customerSearch = ''
                            }) => {
    // Parse YYYY-MM-DD into a full date string
    const formattedDate = useMemo(() => {
        if (!currentDate) return null;
        try {
            const [y, m, d] = currentDate.split('-').map(Number);
            return format(new Date(y, m - 1, d), 'EEEE, MMMM d, yyyy');
        } catch {
            return currentDate;
        }
    }, [currentDate]);

    // Calculate sum of sales for this specific single day
    const dailyTotal = useMemo(() => {
        return salesList.reduce((acc, sale) => acc + Number(sale.totalAmount || sale.totalamount || 0), 0);
    }, [salesList]);

    // Highlight search match in customer names
    const highlightMatch = (text = '', query = '') => {
        if (!query.trim() || !text) return text;
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? (
                <mark key={i} className="bg-lime-200 dark:bg-lime-900 text-slate-900 dark:text-lime-200 rounded-xs px-0.5 font-black">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xs border border-slate-200/90 dark:border-slate-800 overflow-hidden transition-colors">
            {/* Day Header Banner */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 dark:bg-slate-850 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0 shadow-2xs">
                        <Calendar className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight">
                                {formattedDate || 'Sales for Selected Day'}
                            </span>
                            <span className="text-[11px] bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded-full">
                                {salesList.length} {salesList.length === 1 ? 'transaction' : 'transactions'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-400 font-medium mt-0.5">
                            Day {currentPage} of {totalPages} in selected range
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Daily Total:</span>
                    <span className="text-sm font-black text-[#5f7d00] dark:text-lime-400 font-mono">
                        {formatCurrency(dailyTotal)}
                    </span>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="w-full overflow-x-auto hidden md:block">
                <table className="w-full table-auto text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Time</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300">Customer</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300">Item(s) & Qty</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300">Price</th>
                        <th className="px-2 py-3 text-left font-bold text-slate-600 dark:text-slate-300">Discount</th>
                        <th className="px-2 py-3 text-center font-bold text-slate-600 dark:text-slate-300 w-12">Qty</th>
                        <th className="px-3 py-3 text-right font-bold text-slate-600 dark:text-slate-300">Total</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300">Payment</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-600 dark:text-slate-300">Status</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 dark:text-slate-300">Staff</th>
                        {isAdmin && (
                            <th className="px-3 py-3 text-right font-bold text-slate-600 dark:text-slate-300 w-20">Actions</th>
                        )}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {salesList.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 11 : 10} className="text-center py-12 text-slate-400 dark:text-slate-500 font-semibold">
                                No transaction records found for this day.
                            </td>
                        </tr>
                    ) : (
                        salesList.map((sale) => {
                            const rawDate = sale.saleTimestamp || sale.saletimestamp || sale.date;
                            const timeStr = rawDate ? format(new Date(rawDate), 'h:mm a') : 'N/A';
                            const totalQty = (sale.sale_items || sale.items || []).reduce((sum, itm) => sum + Number(itm.quantity || 0), 0);
                            const status = (sale.status || 'Completed').toLowerCase();

                            return (
                                <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                                        {timeStr}
                                    </td>
                                    <td className="px-3 py-2.5 font-bold text-slate-800 dark:text-slate-100 truncate max-w-[130px]" title={sale.customerName}>
                                        {sale.customerName
                                            ? highlightMatch(sale.customerName, customerSearch)
                                            : <span className="text-slate-400 dark:text-slate-500 font-normal">Walk-in</span>}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <div key={idx} className="truncate max-w-[150px] text-slate-700 dark:text-slate-300">
                                                    <span>{item.productName || item.product_name || item.name || 'Refill'}</span>
                                                    <span className="font-black text-emerald-600 dark:text-emerald-400 ml-1">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <span key={idx} className="whitespace-nowrap">
                                                    {formatCurrency(item.productPrice || item.price_at_sale || item.price || 0)}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2.5 font-mono">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <span key={idx} className="whitespace-nowrap">
                                                    {item.discount_amount > 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                            -{formatCurrency(item.discount_amount)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2.5 text-center font-black text-slate-700 dark:text-slate-200 font-mono">
                                        {totalQty}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap font-mono">
                                        {formatCurrency(sale.totalAmount || sale.totalamount || 0)}
                                    </td>

                                    {/* High-Contrast Payment Method Badge */}
                                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                        <span className="inline-block px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 shadow-2xs">
                                            {sale.paymentMethod || sale.paymentmethod || 'Cash'}
                                        </span>
                                    </td>

                                    {/* High-Contrast Status Pill */}
                                    <td className="px-3 py-2.5 whitespace-nowrap text-center">
                                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                            status === 'completed'
                                                ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/80'
                                                : status === 'pending' || status === 'unpaid'
                                                    ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800/80'
                                                    : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800/80'
                                        }`}>
                                            {sale.status || 'Completed'}
                                        </span>
                                    </td>

                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="inline-flex items-center space-x-1.5 font-semibold text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sale.userColor || '#8DB600' }} />
                                            <span className="truncate">{sale.staffName || 'Staff'}</span>
                                        </div>
                                    </td>

                                    {isAdmin && (
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                    onClick={() => onEdit && onEdit(sale)}
                                                    title="Edit Transaction"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                    onClick={() => onDelete && onDelete(sale.id)}
                                                    title="Delete Transaction"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                    </tbody>
                </table>
            </div>

            {/* Mobile View Cards */}
            <div className="md:hidden p-3 bg-slate-50/70 dark:bg-slate-900/80 space-y-3">
                {salesList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                        No sales found for this day.
                    </div>
                ) : (
                    salesList.map((sale) => (
                        <SaleCard
                            key={sale.id}
                            sale={sale}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            isAdmin={isAdmin}
                        />
                    ))
                )}
            </div>

            {/* 1-Day Pagination Footer */}
            {totalPages > 1 && (
                <div className="p-3.5 bg-slate-50/60 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Viewing Day <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
                    </span>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                    />
                </div>
            )}
        </div>
    );
};

export default SalesReportDisplay;