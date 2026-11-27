// src/components/dashboard/KpiMatrix.jsx
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, Droplets, Award, ArrowUpRight, ArrowDownRight, PlusCircle } from 'lucide-react';

function UnifiedPeriodCard({
                               title,
                               currentSales,
                               previousSales,
                               salesGrowth,
                               currentGallons,
                               salesGrowthLabel,
                               currentRange,
                               previousRange,
                               rawCurrentSales = 0,
                               rawPreviousSales = 0,
                               isLoading
                           }) {
    const isSalesPositive = (salesGrowth || 0) >= 0;
    const isGalPositive = (salesGrowthLabel || 0) >= 0;
    const paceRatio = rawPreviousSales > 0 ? Math.min(100, Math.round((rawCurrentSales / rawPreviousSales) * 100)) : 0;

    return (
        <div className="seaside-lift-card bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between gap-1.5 mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/12 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 shrink-0">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                            {title}
                        </span>
                    </div>

                    {salesGrowth !== undefined && salesGrowth !== null && !isLoading && (
                        <div
                            className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shrink-0 ${
                                isSalesPositive
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                    : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
                            }`}
                        >
                            {isSalesPositive ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                            <span>{Math.abs(salesGrowth).toFixed(1)}%</span>
                        </div>
                    )}
                </div>

                <div className="mt-1">
                    {isLoading ? (
                        <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                    ) : (
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {currentSales}
                        </h2>
                    )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-bold truncate">
                        <Droplets className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                        <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                            {isLoading ? '...' : currentGallons}
                        </span>
                    </div>

                    {salesGrowthLabel !== undefined && salesGrowthLabel !== null && !isLoading && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${isGalPositive ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50' : 'text-rose-600 bg-rose-50 dark:bg-rose-950/50'}`}>
                            {isGalPositive ? '↗' : '↘'} {Math.abs(salesGrowthLabel).toFixed(1)}%
                        </span>
                    )}
                </div>

                <div className="mt-2.5 space-y-1">
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isSalesPositive ? 'bg-gradient-to-r from-emerald-500 to-sky-500' : 'bg-amber-500'}`}
                            style={{ width: `${paceRatio}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-semibold text-slate-400">
                        <span>Pace: <strong className="text-slate-700 dark:text-slate-300">{paceRatio}%</strong></span>
                        <span className="truncate pl-1">Prior: <strong className="text-slate-600 dark:text-slate-400">{previousSales}</strong></span>
                    </div>
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                <span className="font-semibold text-slate-500 dark:text-slate-400">Period:</span>
                <span className="font-medium truncate pl-1">
                    {currentRange && previousRange ? `${currentRange} vs. ${previousRange}` : 'Current vs Prior'}
                </span>
            </div>
        </div>
    );
}

export default function KpiMatrix({
                                      todaySales,
                                      yesterdaySales,
                                      recentSalesPct,
                                      isTodayLoading,
                                      todayOrdersCount = 0,
                                      isOrdersLoading = false,
                                      monthlyGrowthData,
                                      isMonthlyGrowthLoading,
                                      weeklyGrowthData,
                                      isWeeklyGrowthLoading,
                                      overallSalesTotal,
                                      lifetimeContainers = 0,
                                      isLifetimeContainersLoading = false,
                                      firstTransactionDate,
                                      isSummaryLoading,
                                      onQuickSaleRecord,
                                      liveCashDrawer
                                  }) {
    const mThisSales = Number(monthlyGrowthData?.thisMonthSales) || 0;
    const mLastSales = Number(monthlyGrowthData?.lastMonthSales) || 0;
    const mSalesGrowth = monthlyGrowthData?.salesGrowth;
    const mThisGal = Number(monthlyGrowthData?.thisMonthGallons) || 0;
    const mGalGrowth = monthlyGrowthData?.gallonsGrowth;

    const wThisSales = Number(weeklyGrowthData?.thisWeekSales) || 0;
    const wLastSales = Number(weeklyGrowthData?.lastWeekSales) || 0;
    const wSalesGrowth = weeklyGrowthData?.salesGrowth;
    const wThisGal = Number(weeklyGrowthData?.thisWeekGallons) || 0;
    const wGalGrowth = weeklyGrowthData?.gallonsGrowth;

    const mRange = useMemo(() => {
        if (!monthlyGrowthData?.thisMonthStart) return null;
        try {
            const curStart = format(new Date(monthlyGrowthData.thisMonthStart), 'MMM d');
            const curEnd = format(new Date(monthlyGrowthData.thisMonthEnd || monthlyGrowthData.thisMonthStart), 'd');
            const prevStart = format(new Date(monthlyGrowthData.lastMonthStart), 'MMM d');
            const prevEnd = format(new Date(monthlyGrowthData.lastMonthEnd || monthlyGrowthData.lastMonthStart), 'd');
            return {
                current: `${curStart} - ${curEnd}`,
                previous: `${prevStart} - ${prevEnd}`
            };
        } catch {
            return null;
        }
    }, [monthlyGrowthData]);

    const wRange = useMemo(() => {
        if (!weeklyGrowthData?.thisWeekStart) return null;
        try {
            const curStart = format(new Date(weeklyGrowthData.thisWeekStart), 'MMM d');
            const curEnd = format(new Date(weeklyGrowthData.thisWeekEnd || weeklyGrowthData.thisWeekStart), 'd');
            const prevStart = format(new Date(weeklyGrowthData.lastWeekStart), 'MMM d');
            const prevEnd = format(new Date(weeklyGrowthData.lastWeekEnd || weeklyGrowthData.lastWeekStart), 'd');
            return {
                current: `${curStart} - ${curEnd}`,
                previous: `${prevStart} - ${prevEnd}`
            };
        } catch {
            return null;
        }
    }, [weeklyGrowthData]);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {/* TILE 1: TODAY'S SALES & CLICKABLE QUICK SALE FOR CASH DRAWER */}
            <div
                onClick={() => onQuickSaleRecord?.(25)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onQuickSaleRecord?.(25);
                    }
                }}
                title="Click to record a ₱25 quick refill sale and update the live cash drawer"
                className="seaside-lift-card bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border-2 border-emerald-500/35 dark:border-emerald-500/45 shadow-2xs flex flex-col justify-between cursor-pointer group"
            >
                <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-500/15 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                                Today&apos;s Sales
                            </span>
                        </div>

                        {recentSalesPct !== null && !isTodayLoading ? (
                            <div className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border shrink-0 ${recentSalesPct >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800' : 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'}`}>
                                {recentSalesPct >= 0 ? <ArrowUpRight className="w-3 h-3 stroke-[2.5]" /> : <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />}
                                <span>{Math.abs(recentSalesPct)}%</span>
                            </div>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/25 shrink-0">
                                <PlusCircle className="w-3 h-3" />
                                <span>+₱25</span>
                            </span>
                        )}
                    </div>

                    <div className="mt-1">
                        {isTodayLoading ? (
                            <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                        ) : (
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                ₱{todaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
                        <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">vs Yesterday:</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                            ₱{yesterdaySales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                        <PlusCircle className="w-3 h-3" />
                        <span>
                            {liveCashDrawer !== undefined
                                ? `Drawer ₱${Number(liveCashDrawer).toLocaleString('en-US', { minimumFractionDigits: 0 })}`
                                : 'Quick +₱25'}
                        </span>
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                        {isOrdersLoading ? '...' : `${todayOrdersCount} ${todayOrdersCount === 1 ? 'Order' : 'Orders'}`}
                    </span>
                </div>
            </div>

            {/* TILE 2: THIS MONTH */}
            <UnifiedPeriodCard
                title="This Month"
                isLoading={isMonthlyGrowthLoading}
                currentSales={`₱${mThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                previousSales={`₱${mLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                salesGrowth={mSalesGrowth}
                currentGallons={`${mThisGal.toLocaleString()} containers`}
                salesGrowthLabel={mGalGrowth}
                currentRange={mRange?.current}
                previousRange={mRange?.previous}
                rawCurrentSales={mThisSales}
                rawPreviousSales={mLastSales}
            />

            {/* TILE 3: THIS WEEK */}
            <UnifiedPeriodCard
                title="This Week"
                isLoading={isWeeklyGrowthLoading}
                currentSales={`₱${wThisSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                previousSales={`₱${wLastSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                salesGrowth={wSalesGrowth}
                currentGallons={`${wThisGal.toLocaleString()} containers`}
                salesGrowthLabel={wGalGrowth}
                currentRange={wRange?.current}
                previousRange={wRange?.previous}
                rawCurrentSales={wThisSales}
                rawPreviousSales={wLastSales}
            />

            {/* TILE 4: OVERALL LIFETIME SALES & LIFETIME CONTAINERS */}
            <div className="seaside-lift-card bg-white dark:bg-slate-900 rounded-2xl p-3.5 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
                <div>
                    <div className="flex items-center justify-between gap-1 mb-2">
                        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-sky-500/12 dark:bg-sky-950/50 flex items-center justify-center text-sky-600 dark:text-sky-400 border border-sky-500/25 shrink-0">
                                <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                            </div>
                            <span className="text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                                Lifetime Sales
                            </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 shrink-0">
                            All-Time
                        </span>
                    </div>

                    <div className="mt-1">
                        {isSummaryLoading ? (
                            <div className="h-6 sm:h-7 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />
                        ) : (
                            <h2 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                ₱{overallSalesTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>
                        )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] sm:text-[11px] font-medium text-slate-400 leading-tight">
                        <span>Milestone:</span>
                        <p className="font-semibold text-slate-600 dark:text-slate-300 truncate mt-0.5">
                            {firstTransactionDate ? `Since ${firstTransactionDate}` : 'Total Station Receipts'}
                        </p>
                    </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[9px] sm:text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-500 dark:text-slate-400">Containers Sold:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {isLifetimeContainersLoading ? '...' : `${Number(lifetimeContainers || 0).toLocaleString()} containers`}
                    </span>
                </div>
            </div>
        </div>
    );
}