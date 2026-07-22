import React from 'react';
import { Card, CardContent, cn } from '../ui';

const SummaryCard = ({ title, value, previousValue, previousPeriodRange, percentage, isPositive, isPositiveColor, comparisonText, isLoading, className }) => (
    <Card className={cn("h-full border-none shadow-sm flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors", className)}>
        <CardContent className="p-4 md:p-6 lg:p-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-2">{title}</h3>
            {isLoading ? (
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-2"></div>
            ) : (
                <div className="text-xl sm:text-2xl lg:text-xl font-bold text-slate-900 dark:text-white mb-2">{value}</div>
            )}
            <div className="flex items-center text-[10px] sm:text-xs">
                {percentage !== undefined && (
                    <span className={cn("font-bold flex items-center", isPositiveColor ? "text-positive" : "text-negative")}>
                        {isPositive ? '▲' : '▼'} {percentage}%
                    </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 ml-1">{comparisonText}</span>
            </div>
            {previousValue && !isLoading && (
                <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 leading-tight">
                    <div>Last Period: {previousValue}</div>
                    {previousPeriodRange && <div>{previousPeriodRange}</div>}
                </div>
            )}
        </CardContent>
    </Card>
);

export default SummaryCard;
