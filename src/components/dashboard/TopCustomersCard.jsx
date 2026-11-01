// src/components/dashboard/TopCustomersCard.jsx
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import './chartSetup'; // Registers CategoryScale, LinearScale, BarElement
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardContent } from '../ui';
import { Users } from 'lucide-react';

const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-full text-slate-400 text-sm">Loading Customers Chart...</div>
});

export default function TopCustomersCard() {
    const user = useStore(state => state.user);

    const { data: topCustomers, isLoading } = useQuery({
        queryKey: ['top-customers-all-time', user?.isDemo],
        queryFn: async () => {
            if (user?.isDemo) {
                return [
                    { name: 'Demo Customer A', revenue: 125000.00 },
                    { name: 'Demo Customer B', revenue: 98000.50 },
                    { name: 'Demo Customer C', revenue: 85000.00 },
                    { name: 'Demo Customer D', revenue: 76000.25 },
                    { name: 'Demo Customer E', revenue: 68000.00 },
                    { name: 'Demo Customer F', revenue: 54000.00 },
                    { name: 'Demo Customer G', revenue: 49000.75 },
                    { name: 'Demo Customer H', revenue: 41000.00 },
                    { name: 'Demo Customer I', revenue: 32000.50 },
                    { name: 'Demo Customer J', revenue: 28000.00 },
                ];
            }

            const { data, error } = await supabase
                .from('sales')
                .select('customername, totalamount');

            if (error) throw error;

            const revenueByCustomer = {};
            data.forEach(sale => {
                const name = sale.customername;
                if (!name || name.toLowerCase() === 'n/a' || name.toLowerCase().includes('walk-in')) return;
                revenueByCustomer[name] = (revenueByCustomer[name] || 0) + Number(sale.totalamount || 0);
            });

            return Object.entries(revenueByCustomer)
                .map(([name, revenue]) => ({ name, revenue }))
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10);
        },
        staleTime: 1000 * 60 * 60
    });

    const topCustomersTotal = useMemo(() => {
        if (!topCustomers || !topCustomers.length) return 0;
        return topCustomers.reduce((acc, c) => acc + (Number(c.revenue) || 0), 0);
    }, [topCustomers]);

    const topCustomersBarChartData = useMemo(() => {
        if (!topCustomers || topCustomers.length === 0) return { labels: [], datasets: [] };

        return {
            labels: topCustomers.map((c, index) => `${index + 1}. ${c.name}`),
            datasets: [{
                label: 'Total Revenue',
                data: topCustomers.map(c => c.revenue),
                backgroundColor: '#10b981',
                borderRadius: 6,
                barPercentage: 0.65
            }]
        };
    }, [topCustomers]);

    const topCustomersBarChartOptions = {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                titleColor: '#ffffff',
                bodyColor: '#cbd5e1',
                padding: 10,
                cornerRadius: 8,
                callbacks: {
                    label: (context) => ` Total Spend: ₱${context.parsed.x.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                }
            }
        },
        scales: {
            x: {
                grid: { color: 'rgba(241, 245, 249, 0.8)' },
                border: { display: false },
                ticks: {
                    callback: (value) => `₱${(value / 1000).toFixed(0)}k`,
                    color: '#94a3b8',
                    font: { size: 11, weight: '500' }
                }
            },
            y: {
                grid: { display: false },
                border: { display: false },
                ticks: { color: '#475569', font: { size: 12, weight: '600' } }
            }
        }
    };

    return (
        <Card className="shadow-xs min-h-[390px] flex flex-col bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <CardHeader className="bg-transparent pb-0 shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 dark:text-white text-base">Top 10 All-Time Customers</h3>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    ₱{(topCustomersTotal / 1000).toFixed(0)}k Cumulative
                </span>
            </CardHeader>
            <CardContent className="p-4 pt-1 flex-1 flex flex-col w-full h-full">
                <div className="flex items-center gap-2 mb-2 ml-1 text-xs text-slate-500 font-semibold shrink-0">
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-xs" />
                    Total Revenue (₱)
                </div>
                <div className="flex-1 w-full h-full min-h-[270px] relative">
                    {isLoading ? (
                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">Loading customers...</div>
                    ) : topCustomers?.length === 0 ? (
                        <div className="flex items-center justify-center w-full h-full text-slate-400 text-sm">No sales data available.</div>
                    ) : (
                        <Bar key="top-customers-bar" data={topCustomersBarChartData} options={topCustomersBarChartOptions} />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}