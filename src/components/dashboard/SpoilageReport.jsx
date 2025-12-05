import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { Card, CardHeader, CardContent } from '../ui';
import currency from 'currency.js';

const SpoilageReport = () => {
    const { data: spoilageData, isLoading } = useQuery({
        queryKey: ['spoilage-report'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('view_spoilage_report')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);
            if (error) throw error;
            return data;
        }
    });

    if (isLoading) return <div className="p-4 text-sm text-gray-500">Loading loss report...</div>;
    if (!spoilageData || spoilageData.length === 0) return null;

    const totalLoss = spoilageData.reduce((acc, curr) => acc + curr.total_loss_value, 0);

    return (
        <Card className="border-l-4 border-l-orange-500 shadow-sm mt-6">
            <CardHeader className="bg-orange-50 pb-3 border-b border-orange-100">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg text-orange-800 flex items-center gap-2">
                        📉 Spoilage & Loss
                    </h3>
                    <div className="text-right">
                        <span className="text-xs text-gray-500 block">Estimated Loss</span>
                        <span className="font-bold text-red-600">{currency(totalLoss, { symbol: '₱' }).format()}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Product</th>
                                <th className="px-4 py-2 text-left font-medium text-gray-600">Reason</th>
                                <th className="px-4 py-2 text-center font-medium text-gray-600">Qty</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-600">Value</th>
                                <th className="px-4 py-2 text-right font-medium text-gray-600">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {spoilageData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-800">{item.product_name}</td>
                                    <td className="px-4 py-2 capitalize text-orange-700 bg-orange-50/50">{item.reason}</td>
                                    <td className="px-4 py-2 text-center font-bold">{item.quantity_lost}</td>
                                    <td className="px-4 py-2 text-right font-medium text-red-600">
                                        {currency(item.total_loss_value, { symbol: '₱' }).format()}
                                    </td>
                                    <td className="px-4 py-2 text-right text-xs text-gray-500">
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
};

export default SpoilageReport;

