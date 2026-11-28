// src/hooks/useDailySales.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

function getManilaDateStr(offsetDays = 0) {
    const target = new Date(Date.now() + offsetDays * 86400000);
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(target);
}

export function useDailySales(storeId = null) {
    const isDemo = useStore(s => s.user?.isDemo);
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['daily-sales', targetStoreId, isDemo],
        queryFn: async () => {
            if (isDemo) {
                return { todaySales: 3160.46, yesterdaySales: 2896.50 };
            }

            const todayStr = getManilaDateStr(0);
            const yesterdayStr = getManilaDateStr(-1);

            const todayStart = new Date(`${todayStr}T00:00:00+08:00`).toISOString();
            const todayEnd = new Date(`${todayStr}T23:59:59.999+08:00`).toISOString();
            const yesterdayStart = new Date(`${yesterdayStr}T00:00:00+08:00`).toISOString();
            const yesterdayEnd = new Date(`${yesterdayStr}T23:59:59.999+08:00`).toISOString();

            const [todayRes, yesterdayRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('totalamount')
                    .eq('store_id', targetStoreId)
                    .gte('saletimestamp', todayStart)
                    .lte('saletimestamp', todayEnd),
                supabase
                    .from('sales')
                    .select('totalamount')
                    .eq('store_id', targetStoreId)
                    .gte('saletimestamp', yesterdayStart)
                    .lte('saletimestamp', yesterdayEnd),
            ]);

            if (todayRes.error) throw todayRes.error;
            if (yesterdayRes.error) throw yesterdayRes.error;

            const todaySales = (todayRes.data || []).reduce((sum, s) => sum + parseFloat(s.totalamount || 0), 0);
            const yesterdaySales = (yesterdayRes.data || []).reduce((sum, s) => sum + parseFloat(s.totalamount || 0), 0);

            return { todaySales, yesterdaySales };
        },
        staleTime: 1000 * 60 * 2,
    });
}