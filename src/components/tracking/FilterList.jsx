import React from 'react';
import { Card, CardContent, Button } from '../ui';
import { PackageIcon } from '../Icons';
import { History, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function FilterList({ processedFilters, handleReplace, handleViewHistory, isPurchasing }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {processedFilters.map(filter => (
                <Card key={filter.id} className={`border-0 ring-1 shadow-sm ${filter.isOverdue ? 'ring-red-200 bg-red-50/30' : 'ring-gray-200 bg-white'}`}>
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${filter.isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <PackageIcon className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="font-bold text-gray-900">{filter.name} {filter.pcs > 1 && <span className="text-xs font-normal text-gray-500">({filter.pcs} pcs)</span>}</h3>
                                        {filter.isOverdue ? (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100/80 border border-red-200 px-2 py-0.5 rounded-full">
                                                <AlertTriangle className="w-3 h-3" /> Due for Replacement
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Filters are still good
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 max-w-[200px] leading-tight mt-0.5">{filter.purpose}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <span className="text-lg font-black text-gray-800">₱{filter.cost * filter.pcs}</span>
                                <p className="text-[10px] text-gray-400">total piece(s) cost</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">Time Elapsed</span>
                                    <span className="font-semibold text-gray-800">{filter.daysPassed} / {filter.lifespanDays} Days</span>
                                </div>
                                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                                    <span className="text-gray-500 block">Usage (Sold)</span>
                                    <span className="font-semibold text-gray-800">{filter.containersSold} / {filter.containersText}</span>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-medium">Time Remaining</span>
                                    <span className={`font-bold ${filter.isTimeOverdue ? 'text-red-600' : 'text-primary'}`}>
                                        {filter.isTimeOverdue ? 'OVERDUE' : `${filter.daysLeft} days left`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full ${filter.isTimeOverdue ? 'bg-red-500' : filter.timePercent > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                                        style={{ width: `${filter.timePercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-medium">Containers Remaining</span>
                                    <span className={`font-bold ${filter.isUsageOverdue ? 'text-red-600' : 'text-primary'}`}>
                                        {filter.isUsageOverdue ? 'LIMIT REACHED' : `${filter.containersLeft} containers left`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full ${filter.isUsageOverdue ? 'bg-red-500' : filter.usagePercent > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                                        style={{ width: `${filter.usagePercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handleViewHistory(filter.id)}
                                    className="flex items-center justify-center gap-1 flex-1 h-10 bg-gray-50 border-gray-200"
                                >
                                    <History className="w-4 h-4"/> History
                                </Button>
                                <Button
                                    onClick={() => handleReplace(filter.id)}
                                    disabled={isPurchasing}
                                    className={`flex-[2] h-10 shadow-sm ${filter.isOverdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn--outline'}`}
                                >
                                    {filter.isOverdue ? 'Mark as Replaced' : 'Record Replacement'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}