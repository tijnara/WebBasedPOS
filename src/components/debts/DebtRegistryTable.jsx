// src/components/debts/DebtRegistryTable.jsx
import React, { useState } from 'react';
import currency from 'currency.js';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, ChevronUp, ChevronDown, Edit2, Trash2, Receipt, History } from 'lucide-react';

const formatDateSafe = (dateStr, formatPattern = 'MMM dd, yyyy') => {
    if (!dateStr) return 'N/A';
    try {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : format(d, formatPattern);
    } catch {
        return dateStr;
    }
};

export default function DebtRegistryTable({
                                              data = [],
                                              isLoading,
                                              emptyMessage,
                                              onPay,
                                              onEdit,
                                              onDelete,
                                              isDemo
                                          }) {
    const [expandedRows, setExpandedRows] = useState(new Set());

    const toggleRow = (id) => {
        const next = new Set(expandedRows);
        next.has(id) ? next.delete(id) : next.add(id);
        setExpandedRows(next);
    };

    if (isLoading) {
        return <div className="text-center py-16 text-slate-400 font-medium text-xs">Loading records...</div>;
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-16 text-slate-400 font-medium text-xs space-y-1">
                <p>{emptyMessage}</p>
                <p className="text-[11px] text-slate-400">Use the form on the left to log a new entry.</p>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Desktop Table View */}
            <div className="hidden md:block w-full overflow-x-hidden">
                <table className="w-full table-fixed text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80 dark:border-slate-800">
                    <tr>
                        <th className="w-[32%] py-3 px-3 text-left">Account Details</th>
                        <th className="w-[18%] py-3 px-3 text-left">Terms</th>
                        <th className="w-[22%] py-3 px-3 text-left">Progress</th>
                        <th className="w-[14%] py-3 px-3 text-right">Remaining</th>
                        <th className="w-[14%] py-3 px-3 text-right">Actions</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                    {data.map((debt) => {
                        const isExpanded = expandedRows.has(debt.id);
                        const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                        const isFullyPaid = debt.remainingDebt <= 0;

                        return (
                            <React.Fragment key={debt.id}>
                                <tr className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors ${isFullyPaid ? 'bg-slate-50/40 dark:bg-slate-800/20 opacity-75' : ''}`}>
                                    <td className="py-3 px-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[200px]" title={debt.description}>
                                                    {debt.description}
                                                </span>
                                            {isFullyPaid && (
                                                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Cleared
                                                    </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono mt-0.5">
                                            <span>#{debt.id}</span>
                                            <span>•</span>
                                            <span>{formatDateSafe(debt.debt_date)}</span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                            {currency(debt.total_debt_amount, { symbol: '₱' }).format()}
                                        </div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                            {currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}
                                            {(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15 days'}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3">
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-[#8DB600]'}`}
                                                style={{ width: `${progressPct}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-1 text-[10px] font-bold">
                                                <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                                                    {currency(debt.totalPaid, { symbol: '₱' }).format()} PAID
                                                </span>
                                            <span className="text-slate-400">
                                                    {Math.round(progressPct)}%
                                                </span>
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right">
                                        <div className={`font-black text-xs sm:text-sm whitespace-nowrap ${isFullyPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                                            {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                        </div>
                                    </td>

                                    <td className="py-3 px-3 text-right">
                                        <div className="flex items-center justify-end gap-1.5">
                                            {!isFullyPaid && (
                                                <button
                                                    type="button"
                                                    onClick={() => onPay(debt)}
                                                    className="px-2.5 py-1 text-xs font-bold bg-[#8DB600] hover:bg-[#7ca000] text-white rounded-lg transition-colors shadow-2xs"
                                                    title="Record Payment"
                                                    disabled={isDemo}
                                                >
                                                    Pay
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => toggleRow(debt.id)}
                                                className={`h-7 px-2 rounded-lg flex items-center gap-1 text-[11px] font-bold border transition-colors ${
                                                    isExpanded
                                                        ? 'bg-slate-900 dark:bg-slate-700 text-white border-slate-900 dark:border-slate-700'
                                                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                                }`}
                                                title={isExpanded ? 'Hide History' : 'View Payment History'}
                                            >
                                                <span>{debt.sortedPayments.length}</span>
                                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onEdit(debt)}
                                                className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                                                title="Edit Account Details"
                                                disabled={isDemo}
                                            >
                                                <Edit2 className="w-3 h-3" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onDelete(debt)}
                                                className="w-7 h-7 flex items-center justify-center text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                                                title="Delete Liability Account"
                                                disabled={isDemo}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                {/* Tabular Payment History Drawer */}
                                {isExpanded && (
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
                                        <td colSpan={5} className="p-0">
                                            <div className="p-4 border-l-4 border-l-[#8DB600] bg-white dark:bg-slate-900 m-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                                                        <Receipt className="w-4 h-4 text-[#8DB600]" />
                                                        <span>Payment History ({debt.sortedPayments.length})</span>
                                                    </div>
                                                    {!isFullyPaid && (
                                                        <button
                                                            type="button"
                                                            onClick={() => onPay(debt)}
                                                            className="text-xs font-bold text-[#8DB600] hover:underline"
                                                        >
                                                            + Add Payment
                                                        </button>
                                                    )}
                                                </div>

                                                {debt.sortedPayments.length > 0 ? (
                                                    <div className="overflow-hidden border border-slate-100 dark:border-slate-800 rounded-lg">
                                                        <table className="w-full text-xs">
                                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                                                            <tr>
                                                                <th className="py-2 px-3 text-left">Date Paid</th>
                                                                <th className="py-2 px-3 text-left">Reference</th>
                                                                <th className="py-2 px-3 text-right">Amount Paid</th>
                                                            </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                                                            {debt.sortedPayments.map((p, idx) => (
                                                                <tr key={p.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                                                                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{formatDateSafe(p.date_paid || p.payment_date)}</td>
                                                                    <td className="py-2 px-3 text-slate-400">TXN #{p.id || idx + 1}</td>
                                                                    <td className="py-2 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                                                                        +{currency(p.amount_paid, { symbol: '₱' }).format()}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-4 text-xs text-slate-400 italic">
                                                        No payments recorded for this account yet.
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                {data.map((debt) => {
                    const isExpanded = expandedRows.has(debt.id);
                    const progressPct = debt.total_debt_amount > 0 ? Math.min(100, (debt.totalPaid / debt.total_debt_amount) * 100) : 0;
                    const isFullyPaid = debt.remainingDebt <= 0;

                    return (
                        <div key={debt.id} className="p-4 space-y-3 bg-white dark:bg-slate-900">
                            {/* Title & Remaining Balance */}
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                                        <span className="truncate">{debt.description}</span>
                                        {isFullyPaid && (
                                            <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                                Cleared
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                                        #{debt.id} • {formatDateSafe(debt.debt_date)}
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <div className={`font-black text-sm ${isFullyPaid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-500'}`}>
                                        {currency(debt.remainingDebt, { symbol: '₱' }).format()}
                                    </div>
                                    <div className="text-[10px] text-slate-400">remaining</div>
                                </div>
                            </div>

                            {/* Principal & Terms */}
                            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                <span>Principal: <strong>{currency(debt.total_debt_amount, { symbol: '₱' }).format()}</strong></span>
                                <span>Terms: <strong>{currency(debt.weekly_payment_amount || 0, { symbol: '₱' }).format()}{(!debt.frequency || debt.frequency === 'Weekly') ? ' / wk' : ' / 15d'}</strong></span>
                            </div>

                            {/* Progress Bar */}
                            <div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden flex">
                                    <div
                                        className={`h-2 rounded-full transition-all duration-500 ${isFullyPaid ? 'bg-emerald-500' : 'bg-[#8DB600]'}`}
                                        style={{ width: `${progressPct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between items-center mt-1 text-[10px] font-bold">
                                    <span className="text-emerald-700 dark:text-emerald-400">{currency(debt.totalPaid, { symbol: '₱' }).format()} PAID</span>
                                    <span className="text-slate-400">{Math.round(progressPct)}%</span>
                                </div>
                            </div>

                            {/* Mobile Action Controls & Touch Targets */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => toggleRow(debt.id)}
                                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                                        isExpanded
                                            ? 'bg-slate-900 dark:bg-slate-700 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                    }`}
                                >
                                    <History className="w-3.5 h-3.5" />
                                    <span>History ({debt.sortedPayments.length})</span>
                                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                </button>

                                <div className="flex items-center gap-2">
                                    {!isFullyPaid && (
                                        <button
                                            type="button"
                                            onClick={() => onPay(debt)}
                                            disabled={isDemo}
                                            className="px-3.5 py-1.5 text-xs font-bold bg-[#8DB600] hover:bg-[#7ca000] text-white rounded-xl shadow-xs active:scale-95 transition-all"
                                        >
                                            Pay
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onEdit(debt)}
                                        disabled={isDemo}
                                        className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-600 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors active:scale-95"
                                        title="Edit Details"
                                    >
                                        <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDelete(debt)}
                                        disabled={isDemo}
                                        className="w-8 h-8 flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl transition-colors active:scale-95"
                                        title="Delete Account"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Expanded Payment History Drawer */}
                            {isExpanded && (
                                <div className="mt-2 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                                    {debt.sortedPayments.length > 0 ? (
                                        debt.sortedPayments.map((p, idx) => (
                                            <div key={p.id || idx} className="flex justify-between items-center text-xs bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">
                                                <div>
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{formatDateSafe(p.date_paid || p.payment_date)}</span>
                                                    <span className="text-[10px] text-slate-400 block font-mono">TXN #{p.id || idx + 1}</span>
                                                </div>
                                                <span className="font-black text-emerald-600 dark:text-emerald-400">+{currency(p.amount_paid, { symbol: '₱' }).format()}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-2 text-xs text-slate-400 italic">No payments recorded yet.</div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}