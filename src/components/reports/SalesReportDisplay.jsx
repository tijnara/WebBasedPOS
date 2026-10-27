// src/components/reports/SalesReportDisplay.jsx
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import currency from 'currency.js';
import Pagination from '../Pagination';
import SaleCard from './SaleCard';
import { Pencil, Trash2, Calendar, FileText } from 'lucide-react';

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
    // Correctly parse YYYY-MM-DD into a full date string
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
                <mark key={i} className="bg-lime-200 text-slate-900 rounded-xs px-0.5 font-black">
                    {part}
                </mark>
            ) : (
                part
            )
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
            {/* Day Header Banner */}
            <div className="p-3.5 sm:p-4 bg-slate-50/90 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-lime-100 text-[#5f7d00] flex items-center justify-center shrink-0 shadow-2xs">
                        <Calendar className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-slate-900 text-sm sm:text-base tracking-tight">
                                {formattedDate || 'Sales for Selected Day'}
                            </span>
                            <span className="text-[11px] bg-slate-200/80 text-slate-700 font-bold px-2 py-0.5 rounded-full">
                                {salesList.length} {salesList.length === 1 ? 'transaction' : 'transactions'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            Day {currentPage} of {totalPages} in selected range
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span className="text-xs font-bold text-slate-500">Daily Total:</span>
                    <span className="text-sm font-black text-[#5f7d00]">
                        {formatCurrency(dailyTotal)}
                    </span>
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="w-full overflow-x-auto hidden md:block">
                <table className="w-full table-auto text-xs">
                    <thead className="bg-slate-100/70 border-b border-slate-200">
                    <tr>
                        <th className="px-3 py-3 text-left font-bold text-slate-600 whitespace-nowrap">Time</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Customer</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Item(s) & Qty</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Price</th>
                        <th className="px-2 py-3 text-left font-bold text-slate-600">Discount</th>
                        <th className="px-2 py-3 text-center font-bold text-slate-600 w-12">Qty</th>
                        <th className="px-3 py-3 text-right font-bold text-slate-600">Total</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Payment</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Status</th>
                        <th className="px-3 py-3 text-left font-bold text-slate-600">Staff</th>
                        {isAdmin && (
                            <th className="px-3 py-3 text-right font-bold text-slate-600 w-20">Actions</th>
                        )}
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                    {salesList.length === 0 ? (
                        <tr>
                            <td colSpan={isAdmin ? 11 : 10} className="text-center py-12 text-slate-400 font-semibold">
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
                                <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-500 font-medium">
                                        {timeStr}
                                    </td>
                                    <td className="px-3 py-2.5 font-bold text-slate-800 truncate max-w-[130px]" title={sale.customerName}>
                                        {sale.customerName
                                            ? highlightMatch(sale.customerName, customerSearch)
                                            : <span className="text-slate-400 font-normal">Walk-in</span>}
                                    </td>
                                    <td className="px-3 py-2.5">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <div key={idx} className="truncate max-w-[150px] text-slate-700">
                                                    <span>{item.productName || item.product_name || item.name || 'Refill'}</span>
                                                    <span className="font-black text-emerald-600 ml-1">x{item.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-3 py-2.5 text-slate-600">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <span key={idx} className="whitespace-nowrap">
                                                        {formatCurrency(item.productPrice || item.price_at_sale || item.price || 0)}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2.5">
                                        <div className="flex flex-col space-y-0.5">
                                            {(sale.sale_items || sale.items || []).map((item, idx) => (
                                                <span key={idx} className="whitespace-nowrap">
                                                        {item.discount_amount > 0 ? (
                                                            <span className="text-emerald-600 font-bold">
                                                                -{formatCurrency(item.discount_amount)}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-300">—</span>
                                                        )}
                                                    </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-2 py-2.5 text-center font-black text-slate-700">
                                        {totalQty}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-black text-slate-900 whitespace-nowrap">
                                        {formatCurrency(sale.totalAmount || sale.totalamount || 0)}
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-slate-600">
                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
                                                {sale.paymentMethod || sale.paymentmethod || 'Cash'}
                                            </span>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                status === 'completed'
                                                    ? 'bg-lime-100 text-[#5f7d00] border border-lime-200'
                                                    : status === 'pending' || status === 'unpaid'
                                                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                        : 'bg-rose-100 text-rose-700 border border-rose-200'
                                            }`}>
                                                {sale.status || 'Completed'}
                                            </span>
                                    </td>
                                    <td className="px-3 py-2.5 whitespace-nowrap">
                                        <div className="inline-flex items-center space-x-1.5 font-semibold text-slate-600 truncate max-w-[120px]">
                                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: sale.userColor || '#8DB600' }} />
                                            <span className="truncate">{sale.staffName || 'Staff'}</span>
                                        </div>
                                    </td>

                                    {isAdmin && (
                                        <td className="px-3 py-2.5 text-right whitespace-nowrap">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                                                    onClick={() => onEdit && onEdit(sale)}
                                                    title="Edit Transaction"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition-colors"
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
            <div className="md:hidden p-3 bg-slate-50/70 space-y-3">
                {salesList.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
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
                <div className="p-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">
                        Viewing Day <strong className="text-slate-800">{currentPage}</strong> of <strong>{totalPages}</strong>
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