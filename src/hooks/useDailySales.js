import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function useDailySales() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: ['daily-sales', isDemo],
        queryFn: async () => {
            if (isDemo) {
                return { todaySales: 3160.46, yesterdaySales: 2896.50 };
            }

            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
            const yesterdayStart = new Date(todayStart);
            yesterdayStart.setDate(yesterdayStart.getDate() - 1);
            const yesterdayEnd = new Date(todayEnd);
            yesterdayEnd.setDate(yesterdayEnd.getDate() - 1);

            const [todayRes, yesterdayRes] = await Promise.all([
                supabase
                    .from('sales')
                    .select('totalamount')
                    .gte('saletimestamp', todayStart.toISOString())
                    .lte('saletimestamp', todayEnd.toISOString()),
                supabase
                    .from('sales')
                    .select('totalamount')
                    .gte('saletimestamp', yesterdayStart.toISOString())
                    .lte('saletimestamp', yesterdayEnd.toISOString()),
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
