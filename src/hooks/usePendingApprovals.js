// src/hooks/usePendingApprovals.js
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function usePendingApprovals(storeId = null) {
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const isAdmin = Boolean(user?.isadmin);
    const targetStoreId = Number(storeId || user?.store_id) || 1;

    // 1. Fetch pending count for this store only
    const { data: pendingUsers = [], isLoading, refetch } = useQuery({
        queryKey: ['pending-approvals-count', targetStoreId],
        queryFn: async () => {
            if (!isAdmin) return [];

            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, dateadded')
                .eq('store_id', targetStoreId)
                .eq('is_approved', false)
                .eq('isadmin', false);

            if (error) {
                console.warn('Error fetching pending approvals:', error.message);
                return [];
            }
            return data || [];
        },
        enabled: isAdmin,
        refetchInterval: 30000,
        staleTime: 10000
    });

    const pendingCount = pendingUsers.length;

    // 2. Real-time listener scoped to this store's staff registrations
    useEffect(() => {
        if (!isAdmin) return;

        const channel = supabase
            .channel(`realtime:pending-users:${targetStoreId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users',
                    filter: `store_id=eq.${targetStoreId}`
                },
                (payload) => {
                    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count', targetStoreId] });

                    if (
                        payload.eventType === 'INSERT' &&
                        payload.new?.is_approved === false &&
                        Number(payload.new?.store_id) === targetStoreId
                    ) {
                        addToast?.({
                            title: 'New Staff Registration',
                            description: `${payload.new.name || 'A new user'} is awaiting administrator approval.`,
                            variant: 'info'
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [isAdmin, targetStoreId, queryClient, addToast]);

    return {
        pendingCount,
        pendingUsers,
        isLoading,
        refetch
    };
}