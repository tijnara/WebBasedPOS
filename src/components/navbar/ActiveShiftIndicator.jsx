// src/components/navbar/ActiveShiftIndicator.jsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import currency from 'currency.js';

export default function ActiveShiftIndicator({ user, onOpenStartShift }) {
    const { data: shiftStats, isLoading } = useQuery({
        queryKey: ['sales', 'active-shift', user?.id],
        queryFn: async () => {
            if (!user) return null;

            if (user.isDemo) {
                const stored = sessionStorage.getItem(`demo_shift_${user.id}`);
                if (!stored) return null;
                const shiftData = JSON.parse(stored);
                const demoSales = shiftData.demo_sales || 0;
                const expected = currency(shiftData.starting_cash).add(demoSales).value;
                return { start: shiftData.starting_cash, sales: demoSales, expected };
            }

            const { data: shifts, error } = await supabase
                .from('shifts')
                .select('*')
                .eq('staff_id', user.id)
                .eq('status', 'OPEN')
                .order('start_time', { ascending: false })
                .limit(1);

            const shift = shifts?.[0];
            if (error || !shift) return null;

            const { data: sales } = await supabase
                .from('sales')
                .select('totalamount')
                .eq('created_by', user.id)
                .eq('paymentmethod', 'Cash')
                .gte('saletimestamp', shift.start_time);

            const totalSales = Array.isArray(sales)
                ? sales.reduce((sum, s) => sum.add(s.totalamount || 0), currency(0)).value
                : 0;

            const expected = currency(shift.starting_cash || 0).add(totalSales).value;

            return {
                start: shift.starting_cash,
                sales: totalSales,
                expected
            };
        },
        enabled: !!user
    });

    if (isLoading) {
        return (
            <div className="flex items-center gap-2 bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold shadow-sm whitespace-nowrap">
                Loading Shift...
            </div>
        );
    }

    if (!shiftStats) {
        return (
            <button
                onClick={onOpenStartShift}
                className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-bold shadow-sm whitespace-nowrap hover:bg-red-100 transition-colors cursor-pointer"
                title="Click to start a new shift"
            >
                No Active Shift (Start)
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 text-xs font-bold shadow-sm whitespace-nowrap" title="Expected Cash in Drawer">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Drawer: ₱{shiftStats.expected.toFixed(2)}</span>
        </div>
    );
}