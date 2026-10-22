// src/hooks/usePendingApprovals.js
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

export function usePendingApprovals() {
    const queryClient = useQueryClient();
    const { user, addToast } = useStore();
    const isAdmin = Boolean(user?.isadmin);

    // 1. Fetch pending count
    const { data: pendingUsers = [], isLoading, refetch } = useQuery({
        queryKey: ['pending-approvals-count'],
        queryFn: async () => {
            if (!isAdmin) return [];

            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, dateadded')
                .eq('is_approved', false)
                .eq('isadmin', false);

            if (error) {
                console.warn('Error fetching pending approvals:', error.message);
                return [];
            }
            return data || [];
        },
        enabled: isAdmin,
        refetchInterval: 30000, // Poll every 30 seconds as fallback
        staleTime: 10000
    });

    const pendingCount = pendingUsers.length;

    // 2. Real-time listener for new staff registrations
    useEffect(() => {
        if (!isAdmin) return;

        const channel = supabase
            .channel('realtime:pending-users')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'users'
                },
                (payload) => {
                    // Invalidate query cache on any user insert/update/delete
                    queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });

                    // Pop toast notification when a new registration arrives
                    if (payload.eventType === 'INSERT' && payload.new?.is_approved === false) {
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
    }, [isAdmin, queryClient, addToast]);

    return {
        pendingCount,
        pendingUsers,
        isLoading,
        refetch
    };
}