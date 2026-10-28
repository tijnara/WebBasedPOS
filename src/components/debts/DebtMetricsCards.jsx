// src/components/debts/DebtMetricsCards.jsx
import React from 'react';
import { Landmark, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DebtMetricsCards({ metrics, activeTab }) {
    const isCompany = activeTab === 'company';

    return (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {/* 1. Initial Capital Debt / Total Advances */}
            <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider truncate block">
                        {isCompany ? 'Initial Debt' : 'Advances'}
                    </span>
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-300 items-center justify-center shrink-0">
                        <Landmark className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-1 sm:mt-2">
                    <span className="text-xs sm:text-xl font-black text-slate-900 dark:text-white tracking-tight break-all">
                        {metrics?.original || '₱0.00'}
                    </span>
                </div>
            </div>

            {/* 2. Principal Amount Paid / Total Repaid */}
            <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate block">
                        {isCompany ? 'Paid' : 'Repaid'}
                    </span>
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 items-center justify-center shrink-0">
                        <CheckCircle2 className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-1 sm:mt-2">
                    <span className="text-xs sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight break-all">
                        {metrics?.paid || '₱0.00'}
                    </span>
                </div>
            </div>

            {/* 3. Net Remaining Liability / Outstanding */}
            <div className="bg-white dark:bg-slate-800 p-2.5 sm:p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs flex flex-col justify-between">
                <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider truncate block">
                        Remaining
                    </span>
                    <div className="hidden sm:flex w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 items-center justify-center shrink-0">
                        <AlertCircle className="w-4 h-4" />
                    </div>
                </div>
                <div className="mt-1 sm:mt-2">
                    <span className="text-xs sm:text-xl font-black text-rose-600 dark:text-rose-500 tracking-tight break-all">
                        {metrics?.remaining || '₱0.00'}
                    </span>
                </div>
            </div>
        </div>
    );
}