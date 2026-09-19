import React from 'react';
import { Card, CardContent, Button } from '../ui';
import { Car, History } from 'lucide-react';

export default function VehicleList({ processedVehicles, handleReplace, handleViewHistory, isPurchasing }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full mt-6">
            <div className="md:col-span-2">
                <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Vehicle Maintenance</h2>
            </div>
            {processedVehicles.map(vehicle => (
                <Card key={vehicle.id} className={`border-0 ring-1 shadow-sm ${vehicle.isOverdue ? 'ring-red-200 bg-red-50/30' : 'ring-gray-200 bg-white'}`}>
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${vehicle.isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                    <Car className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{vehicle.name}</h3>
                                    <p className="text-[11px] text-gray-500 max-w-[200px] leading-tight mt-0.5">{vehicle.purpose}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-2 rounded border border-gray-100 text-xs">
                                <span className="text-gray-500 block">Time Elapsed Since Last Oil Change</span>
                                <span className="font-semibold text-gray-800">{vehicle.daysPassed} / {vehicle.totalLifespanDays} Days</span>
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-600 font-medium">Time Remaining</span>
                                    <span className={`font-bold ${vehicle.isOverdue ? 'text-red-600' : 'text-primary'}`}>
                                        {vehicle.isOverdue ? 'CHANGE OIL REQUIRED' : `${vehicle.daysLeft} days left`}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                        className={`h-2 rounded-full ${vehicle.isOverdue ? 'bg-red-500' : vehicle.timePercent > 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                                        style={{ width: `${vehicle.timePercent}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4">
                                <Button
                                    variant="outline"
                                    onClick={() => handleViewHistory(vehicle.id)}
                                    className="flex items-center justify-center gap-1 flex-1 h-10 bg-gray-50 border-gray-200"
                                >
                                    <History className="w-4 h-4"/> History
                                </Button>
                                <Button
                                    onClick={() => handleReplace(vehicle.id)}
                                    disabled={isPurchasing}
                                    className={`flex-[2] h-10 shadow-sm ${vehicle.isOverdue ? 'bg-red-600 hover:bg-red-700 text-white' : 'btn--outline'}`}
                                >
                                    {vehicle.isOverdue ? 'Mark Oil Changed' : 'Record Oil Change'}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}