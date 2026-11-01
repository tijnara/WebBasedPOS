// src/components/reports/SaleCard.jsx
import React from 'react';
import currency from 'currency.js';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';

const formatCurrency = (amount) => {
    const numericAmount = typeof amount === 'string' ? currency(amount).value : currency(amount).value;
    if (isNaN(numericAmount)) {
        return 'N/A';
    }
    return currency(numericAmount, { symbol: '₱', precision: 2 }).format();
};

const formatDate = (dateString) => {
    try {
        return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
        return 'Invalid Date';
    }
};

const SaleCard = ({ sale, onDelete, onEdit, isAdmin }) => {
    if (!sale) return null;

    const items = sale.sale_items || sale.items || [];
    const status = (sale.status || 'Completed').toLowerCase();
    const paymentMethod = sale.paymentMethod || sale.paymentmethod || 'Cash';
    const staffName = sale.staffName || sale.createdBy || sale.users?.name || 'Staff';
    const totalAmount = sale.totalAmount || sale.totalamount || 0;

    return (
        <div className="bg-white dark:bg-slate-850 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-700/80 shadow-2xs space-y-3 transition-colors">
            {/* Header: Date, Customer, Total, Status, and Admin Actions */}
            <div className="flex justify-between items-start gap-2">
                <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                        {formatDate(sale.saleTimestamp || sale.saletimestamp || sale.date)}
                    </div>
                    <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                        {sale.customerName || sale.customername || (
                            <span className="font-normal text-slate-400 dark:text-slate-500">Walk-in</span>
                        )}
                    </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="text-sm font-black text-[#5f7d00] dark:text-lime-400 font-mono">
                        {formatCurrency(totalAmount)}
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        status === 'completed'
                            ? 'bg-lime-50 dark:bg-emerald-950/70 text-[#5f7d00] dark:text-emerald-300 border border-lime-200 dark:border-emerald-800/80'
                            : status === 'pending' || status === 'unpaid'
                                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80'
                                : 'bg-rose-50 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80'
                    }`}>
                        {sale.status || 'Completed'}
                    </span>

                    {/* Admin Actions: Edit & Delete Buttons */}
                    {isAdmin && (
                        <div className="flex items-center gap-1.5 mt-1">
                            {onEdit && (
                                <button
                                    type="button"
                                    onClick={() => onEdit(sale)}
                                    className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Edit Transaction"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    type="button"
                                    onClick={() => onDelete(sale.id)}
                                    className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                    title="Delete Transaction"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Items Breakdown */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5">
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-400">
                    Items
                </div>
                {items.length === 0 ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 italic">No item details recorded.</div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-slate-800 dark:text-slate-200 font-medium truncate pr-2">
                                    {item.productName || item.product_name || 'Item'}{' '}
                                    <strong className="text-emerald-600 dark:text-emerald-400 font-black ml-1">
                                        x{item.quantity || 0}
                                    </strong>
                                </span>
                                <span className="text-slate-600 dark:text-slate-300 font-mono font-semibold shrink-0">
                                    {formatCurrency(item.productPrice || item.price_at_sale || 0)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer: Staff & Payment Details */}
            <div className="pt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="inline-flex items-center gap-1.5 font-medium truncate">
                    <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sale.userColor || sale.users?.color || '#8DB600' }}
                    />
                    <span className="text-slate-700 dark:text-slate-300 truncate">{staffName}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-400 font-medium">Payment:</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-2xs">
                        {paymentMethod}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default SaleCard;