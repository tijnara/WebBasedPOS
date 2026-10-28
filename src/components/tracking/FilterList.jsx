// src/components/tracking/FilterList.jsx
import React from 'react';
import { Card, CardContent, Button } from '../ui';
import { PackageIcon } from '../Icons';
import { History, CheckCircle2, AlertTriangle, Edit2, Clock, Droplets, Wrench } from 'lucide-react';
import currency from 'currency.js';

export default function FilterList({
                                       processedFilters,
                                       handleReplace,
                                       handleViewHistory,
                                       handleEditFilter,
                                       isAdmin,
                                       isPurchasing
                                   }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {processedFilters.map((filter, index) => {
                const totalCost = Number(filter.cost || 0) * Number(filter.pcs || 1);
                const isOverdue = filter.isTimeOverdue;
                const timePercent = Math.min(100, Math.max(0, filter.timePercent || 0));
                const usagePercent = Math.min(100, Math.max(0, filter.usagePercent || 0));

                return (
                    <Card
                        key={filter.id}
                        className={`border rounded-2xl shadow-2xs transition-all duration-150 ${
                            isOverdue
                                ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                                : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                        }`}
                    >
                        <CardContent className="p-4 sm:p-5">
                            {/* Card Header: Icon, Stage, Name, Cost & Admin Edit */}
                            <div className="flex justify-between items-start gap-2 mb-3.5">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        isOverdue
                                            ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                            : 'bg-emerald-100 dark:bg-emerald-950/50 text-[#5f7d00] dark:text-lime-400'
                                    }`}>
                                        <PackageIcon className="w-5 h-5" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-md">
                                                Stage {index + 1}
                                            </span>
                                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                {filter.name}
                                            </h3>
                                            {filter.pcs > 1 && (
                                                <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 font-mono">
                                                    ({filter.pcs} pcs)
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-1 flex items-center gap-2">
                                            {isOverdue ? (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                                    <AlertTriangle className="w-2.5 h-2.5" /> Due for Replacement
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    <CheckCircle2 className="w-2.5 h-2.5" /> Filters are good
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-1 truncate">
                                            {filter.purpose}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right shrink-0 flex flex-col items-end">
                                    <div className="flex items-center gap-1">
                                        <span className="text-sm sm:text-base font-black font-mono text-slate-900 dark:text-slate-100">
                                            {currency(totalCost, { symbol: '₱' }).format()}
                                        </span>
                                        {isAdmin && (
                                            <button
                                                type="button"
                                                onClick={() => handleEditFilter(filter)}
                                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                                title="Edit Filter Limits (Admin)"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-slate-400 uppercase tracking-wider block">
                                        Total pieces cost
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {/* Dual Metric Overview Boxes */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {/* Box 1: Time Elapsed (Basis for Replacement) */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Time (Basis)
                                            </span>
                                            <span className={isOverdue ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-slate-500 dark:text-slate-400'}>
                                                {isOverdue ? 'OVERDUE' : `${filter.daysLeft}d left`}
                                            </span>
                                        </div>
                                        <span className="font-black font-mono text-slate-800 dark:text-slate-200 text-xs">
                                            {filter.daysPassed} / {filter.lifespanDays} Days
                                        </span>
                                    </div>

                                    {/* Box 2: Gallons / Volume Sold (Monitoring) */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                                        <div className="flex justify-between items-center text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-0.5">
                                            <span className="flex items-center gap-1">
                                                <Droplets className="w-3 h-3 text-cyan-600" /> Volume Sold
                                            </span>
                                            <span className="text-slate-500 dark:text-slate-400 font-mono">
                                                {filter.containersLeft.toLocaleString()} left
                                            </span>
                                        </div>
                                        <span className="font-black font-mono text-slate-800 dark:text-slate-200 text-xs">
                                            {Number(filter.containersSold || 0).toLocaleString()} / {Number(filter.containerLimit || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Progress Bar 1: Time Elapsed Lifespan (Primary Replacement Driver) */}
                                <div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" />
                                            <span>Time Lifespan</span>
                                        </span>
                                        <span className={`font-black text-xs font-mono ${
                                            isOverdue
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : timePercent > 80
                                                    ? 'text-amber-600 dark:text-amber-400'
                                                    : 'text-[#5f7d00] dark:text-lime-400'
                                        }`}>
                                            {isOverdue ? '100% (REPLACEMENT DUE)' : `${timePercent.toFixed(0)}% used`}
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                isOverdue
                                                    ? 'bg-rose-500'
                                                    : timePercent > 80
                                                        ? 'bg-amber-500'
                                                        : 'bg-[#8DB600]'
                                            }`}
                                            style={{ width: `${timePercent}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Progress Bar 2: Gallons / Volume Throughput Bar (Monitoring) */}
                                <div>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold flex items-center gap-1">
                                            <Droplets className="w-3 h-3 text-cyan-600" />
                                            <span>Gallon Volume Filtered</span>
                                        </span>
                                        <span className="font-bold text-xs font-mono text-slate-600 dark:text-slate-300">
                                            {usagePercent.toFixed(0)}% capacity
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                        <div
                                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                                usagePercent >= 100
                                                    ? 'bg-cyan-600'
                                                    : 'bg-cyan-500'
                                            }`}
                                            style={{ width: `${Math.min(100, usagePercent)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleViewHistory(filter.id)}
                                        className="flex items-center justify-center gap-1.5 flex-1 h-9.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                                    >
                                        <History className="w-3.5 h-3.5" /> History
                                    </Button>

                                    {/* Solid High-Contrast Replacement Button */}
                                    <button
                                        type="button"
                                        onClick={() => handleReplace(filter.id)}
                                        disabled={isPurchasing}
                                        className={`flex-[2] h-9.5 px-3 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                            isOverdue
                                                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                : 'bg-[#8DB600] hover:bg-[#7ca000] text-white'
                                        }`}
                                    >
                                        <Wrench className="w-3.5 h-3.5 stroke-[2.2]" />
                                        <span>{isOverdue ? 'Mark as Replaced' : 'Record Replacement'}</span>
                                    </button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}