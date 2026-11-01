// src/components/tracking/PendingPurchases.jsx
import React, { useState } from 'react';
import { Card, CardContent, Button } from '../ui';
import { ShoppingCart, Info, ChevronDown, ChevronUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import currency from 'currency.js';

export default function PendingPurchases({
                                             overdueFilters = [],
                                             totalOverdueCost = 0,
                                             handlePurchaseAndRecord,
                                             isPurchasing,
                                             isDemo
                                         }) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasOverdue = overdueFilters.length > 0;

    // Compact All-Clear Banner when no filters are due
    if (!hasOverdue) {
        return (
            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                            All Filters in Good Condition
                        </h4>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            No cartridge replacements or pending expenses required.
                        </p>
                    </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded-full shrink-0">
                    Normal
                </span>
            </div>
        );
    }

    return (
        <Card className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/60 dark:from-slate-900 dark:via-slate-850 dark:to-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-2xl shadow-sm overflow-hidden">
            {/* Header: Clickable Toggle on Mobile */}
            <div
                onClick={() => setIsExpanded(prev => !prev)}
                className="px-4 py-3 bg-amber-100/60 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900/60 flex items-center justify-between cursor-pointer select-none"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <ShoppingCart className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <h3 className="font-extrabold text-xs text-amber-950 dark:text-amber-100 truncate">
                                Pending Purchases
                            </h3>
                            <span className="text-[9px] font-black bg-rose-600 text-white px-1.5 py-0.2 rounded-full font-mono">
                                {overdueFilters.length} DUE
                            </span>
                        </div>
                        <p className="text-[10px] text-amber-800 dark:text-amber-300 font-medium">
                            {currency(totalOverdueCost, { symbol: '₱' }).format()} estimated expense
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    className="p-1 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 transition-colors"
                >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Collapsible Content */}
            {isExpanded && (
                <CardContent className="p-4 space-y-3">
                    {/* Itemized Filter List */}
                    <ul className="divide-y divide-amber-200/50 dark:divide-amber-950/50 text-xs">
                        {overdueFilters.map(f => {
                            const filterTotal = Number(f.cost || 0) * Number(f.pcs || 1);
                            return (
                                <li key={f.id} className="py-2 first:pt-0 last:pb-1 flex justify-between items-center gap-2">
                                    <div className="min-w-0">
                                        <span className="font-bold text-slate-800 dark:text-slate-100 block truncate text-xs">
                                            {f.name}
                                        </span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                            ₱{Number(f.cost || 0).toFixed(2)} × {f.pcs || 1} pcs
                                        </span>
                                    </div>
                                    <span className="font-black font-mono text-slate-900 dark:text-slate-100 shrink-0 text-xs">
                                        {currency(filterTotal, { symbol: '₱' }).format()}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>

                    {/* Total Due Banner */}
                    <div className="bg-white dark:bg-slate-800/80 rounded-xl p-2.5 px-3 border border-amber-200/60 dark:border-slate-700 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Total Due</span>
                        <span className="text-base font-black font-mono text-rose-600 dark:text-rose-400">
                            {currency(totalOverdueCost, { symbol: '₱' }).format()}
                        </span>
                    </div>

                    {/* Operational Amortization Notice */}
                    <div className="bg-blue-50/80 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 text-[10.5px] p-2.5 rounded-xl border border-blue-200/70 dark:border-blue-900/50 flex gap-2 leading-relaxed">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                        <p>
                            Automatically amortizes <strong>weekly operating expenses</strong> across each filter's lifespan to align with your 6-day operating cycle.
                        </p>
                    </div>

                    {/* Action Button */}
                    <Button
                        type="button"
                        onClick={handlePurchaseAndRecord}
                        disabled={isPurchasing || isDemo}
                        variant="primary"
                        className="w-full h-10 text-xs font-black shadow-xs bg-amber-600 hover:bg-amber-700 text-white rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                    >
                        {isPurchasing ? 'Recording Expense...' : 'Purchase & Record Expense'}
                    </Button>
                </CardContent>
            )}
        </Card>
    );
}