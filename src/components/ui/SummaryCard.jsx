import React from 'react';
import { Card, CardContent, cn } from '../ui';

const SummaryCard = ({ title, value, percentage, isPositive, comparisonText, isLoading, className }) => (
    <Card className={cn("h-full border-none shadow-sm flex flex-col justify-center bg-white dark:bg-slate-900 transition-colors", className)}>
        <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-400 mb-2">{title}</h3>
            {isLoading ? (
                <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 animate-pulse rounded mb-2"></div>
            ) : (
                <div className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">{value}</div>
            )}
            <div className="flex items-center text-sm">
                {percentage !== undefined && (
                    <span className={`font-bold flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '▲' : '▼'} {percentage}%
                    </span>
                )}
                <span className="text-slate-500 dark:text-slate-400 ml-1">{comparisonText}</span>
            </div>
        </CardContent>
    </Card>
);

export default SummaryCard;
