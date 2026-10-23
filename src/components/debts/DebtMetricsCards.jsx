// src/components/debts/DebtMetricsCards.jsx
import React from 'react';
import { Landmark, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DebtMetricsCards({ metrics, activeTab }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {activeTab === 'company' ? 'Initial Capital Debt' : 'Total Advances Granted'}
                    </span>
                    <span className="text-xl font-black text-slate-900">{metrics.original}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                    <Landmark className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {activeTab === 'company' ? 'Principal Amount Paid' : 'Total Repaid / Deducted'}
                    </span>
                    <span className="text-xl font-black text-emerald-600">{metrics.paid}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        {activeTab === 'company' ? 'Net Remaining Liability' : 'Outstanding Balances'}
                    </span>
                    <span className="text-xl font-black text-rose-600">{metrics.remaining}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}