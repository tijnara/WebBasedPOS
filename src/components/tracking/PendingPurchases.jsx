import React from 'react';
import { Card, CardContent, Button } from '../ui';
import { ShoppingCart, Info } from 'lucide-react';

export default function PendingPurchases({ overdueFilters, totalOverdueCost, handlePurchaseAndRecord, isPurchasing, isDemo }) {
    return (
        <Card className="sticky top-24 bg-orange-50 overflow-hidden shadow-md">
            <div className="bg-orange-100/50 px-5 py-4">
                <h3 className="font-bold text-orange-900 flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" /> Pending Purchases
                </h3>
                <p className="text-xs text-orange-700 mt-1">Filters that require replacement.</p>
            </div>

            <CardContent className="p-5 space-y-4">
                {overdueFilters.length > 0 ? (
                    <ul className="space-y-3">
                        {overdueFilters.map(f => (
                            <li key={f.id} className="flex justify-between items-center text-sm border-b border-orange-200/50 pb-2">
                                <div>
                                    <span className="font-semibold text-gray-800">{f.name}</span>
                                    <span className="text-xs text-gray-500 block">₱{f.cost} x {f.pcs} pcs</span>
                                </div>
                                <span className="font-bold text-gray-900">₱{f.cost * f.pcs}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-sm text-gray-500 text-center py-4 bg-white rounded-lg border border-orange-100">
                        All filters are currently in good condition.
                    </div>
                )}

                <div className="bg-white rounded-lg p-3 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-600">Total Due</span>
                    <span className="text-xl font-black text-red-600">₱{totalOverdueCost}</span>
                </div>

                <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                    <p>
                        Clicking the button below will automatically create <strong>weekly expenses</strong> for each filter spread across its lifespan (e.g., 4 weeks for Sediment filters) to accurately reflect your 6-day operating schedule.
                    </p>
                </div>

                <Button
                    onClick={handlePurchaseAndRecord}
                    disabled={isPurchasing || isDemo || overdueFilters.length === 0}
                    className={`w-full h-12 shadow-sm font-bold ${
                        overdueFilters.length === 0
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                    }`}
                >
                    {isPurchasing ? 'Recording...' : 'Purchase & Record Expense'}
                </Button>
            </CardContent>
        </Card>
    );
}