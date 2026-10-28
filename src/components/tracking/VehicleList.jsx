// src/components/tracking/VehicleList.jsx
import React from 'react';
import { Card, CardContent, Button } from '../ui';
import { Car, History, Edit2, CheckCircle2, AlertTriangle, Clock, Wrench } from 'lucide-react';

export default function VehicleList({
                                        processedVehicles,
                                        handleReplace,
                                        handleViewHistory,
                                        handleEditVehicle,
                                        isAdmin,
                                        isPurchasing
                                    }) {
    return (
        <div className="space-y-4 w-full">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Vehicle Fleet Maintenance
                    </h2>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono">
                        {processedVehicles.length}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {processedVehicles.map(vehicle => {
                    const isOverdue = vehicle.isTimeOverdue;

                    return (
                        <Card
                            key={vehicle.id}
                            className={`border rounded-2xl shadow-2xs transition-all duration-150 ${
                                isOverdue
                                    ? 'border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20'
                                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900'
                            }`}
                        >
                            <CardContent className="p-4 sm:p-5">
                                {/* Header: Vehicle Info, Status Badge & Admin Edit */}
                                <div className="flex justify-between items-start gap-2 mb-3.5">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isOverdue
                                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-[#5f7d00] dark:text-lime-400'
                                        }`}>
                                            <Car className="w-5 h-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                                                    {vehicle.name}
                                                </h3>
                                                {/* Status Badge */}
                                                {isOverdue ? (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                                        <AlertTriangle className="w-2.5 h-2.5" /> Service Due
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                        <CheckCircle2 className="w-2.5 h-2.5" /> Good Condition
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5 truncate">
                                                {vehicle.purpose || 'Change engine oil every 6 months'}
                                            </p>
                                        </div>
                                    </div>

                                    {isAdmin && (
                                        <button
                                            type="button"
                                            onClick={() => handleEditVehicle(vehicle)}
                                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors shrink-0"
                                            title="Edit Vehicle Settings"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {/* Time Elapsed Metric Box */}
                                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-slate-400" /> Time Elapsed Since Oil Change
                                            </span>
                                            <span className={`text-[10px] font-bold font-mono ${isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {Math.round(vehicle.timePercent)}% passed
                                            </span>
                                        </div>
                                        <span className="font-black font-mono text-slate-800 dark:text-slate-200 text-xs">
                                            {vehicle.daysPassed} / {vehicle.totalLifespanDays} Days
                                        </span>
                                    </div>

                                    {/* Time Remaining Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-center text-xs mb-1">
                                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">
                                                Time Remaining
                                            </span>
                                            <span className={`font-black text-xs font-mono ${
                                                isOverdue
                                                    ? 'text-rose-600 dark:text-rose-400'
                                                    : 'text-slate-700 dark:text-slate-300'
                                            }`}>
                                                {isOverdue ? 'CHANGE OIL REQUIRED' : `${vehicle.daysLeft} days left`}
                                            </span>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                    isOverdue
                                                        ? 'bg-rose-500'
                                                        : vehicle.timePercent > 80
                                                            ? 'bg-amber-500'
                                                            : 'bg-[#8DB600]'
                                                }`}
                                                style={{ width: `${Math.min(100, vehicle.timePercent)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => handleViewHistory(vehicle.id)}
                                            className="flex items-center justify-center gap-1.5 flex-1 h-9.5 text-xs font-bold rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                        >
                                            <History className="w-3.5 h-3.5" /> History
                                        </Button>

                                        {/* Fixed Oil Change Action Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleReplace(vehicle.id)}
                                            disabled={isPurchasing}
                                            className={`flex-[2] h-9.5 px-3 text-xs font-black rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer ${
                                                isOverdue
                                                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                                                    : 'bg-[#8DB600] hover:bg-[#7ca000] text-white'
                                            }`}
                                        >
                                            <Wrench className="w-3.5 h-3.5 stroke-[2.2]" />
                                            <span>{isOverdue ? 'Mark Oil Changed' : 'Record Oil Change'}</span>
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}