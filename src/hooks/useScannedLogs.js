import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

export function useScannedLogs({ startDate, endDate, searchTerm = '' } = {}) {
    const isDemo = useStore((s) => s.user?.isDemo);

    return useQuery({
        queryKey: ['scanned-sales-logs', isDemo, startDate, endDate, searchTerm],
        queryFn: async () => {
            if (isDemo) return [];

            let query = supabase
                .from('scanned_sales_logs')
                .select('*')
                .order('delivery_date', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(200);

            if (startDate) {
                query = query.gte('delivery_date', startDate);
            }
            if (endDate) {
                query = query.lte('delivery_date', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;

            let logs = data || [];
            if (searchTerm.trim()) {
                const term = searchTerm.trim().toLowerCase();
                logs = logs.filter((log) => {
                    const staffMatch = (log.scanned_by_name || '').toLowerCase().includes(term);
                    const dateMatch = (log.delivery_date || '').includes(term);
                    const itemMatch = Array.isArray(log.items_snapshot) &&
                        log.items_snapshot.some((item) =>
                            (item.customer_name || '').toLowerCase().includes(term) ||
                            (item.product_name || '').toLowerCase().includes(term)
                        );
                    return staffMatch || dateMatch || itemMatch;
                });
            }

            return logs;
        },
        staleTime: 1000 * 60 * 2,
    });
}

export function useDeleteScannedLog() {
    const queryClient = useQueryClient();
    const { addToast, user } = useStore();

    return useMutation({
        mutationFn: async (log) => {
            const { error } = await supabase
                .from('scanned_sales_logs')
                .delete()
                .eq('id', log.id);

            if (error) throw error;

            if (log.image_url && log.image_url.includes('/scanned-sheets/')) {
                const pathPart = log.image_url.split('/scanned-sheets/')[1];
                if (pathPart) {
                    await supabase.storage.from('scanned-sheets').remove([decodeURIComponent(pathPart)]);
                }
            }

            logActivity({
                user,
                action: 'DELETE_SCANNED_LOG',
                entity_type: 'SCANNED_LOG',
                description: `Deleted scanned sheet #${log.id} (${log.delivery_date})`
            });

            return log.id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['scanned-sales-logs'] });
            addToast({
                title: 'Scan Record Deleted',
                description: 'The saved scan image has been removed.',
                variant: 'success',
            });
        },
        onError: (err) => {
            addToast({
                title: 'Deletion Failed',
                description: err.message,
                variant: 'destructive',
            });
        },
    });
}