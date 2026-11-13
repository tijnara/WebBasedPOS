// src/hooks/useActivityLogs.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const logActivity = async ({ user, action, entity_type, description, created_at }) => {
    if (!user || user.isDemo) return;

    const resolvedName = user.name || user.username || user.email || 'Staff User';
    const isAdminUser = Boolean(
        user.isAdmin ||
        user.isadmin ||
        user.is_admin ||
        String(user.role?.name || user.role || '').toLowerCase().includes('admin')
    );
    const resolvedRole = user.role?.name || user.role || (isAdminUser ? 'Admin' : 'Staff');
    const numericUserId =
        typeof user.id === 'number'
            ? user.id
            : /^\d+$/.test(String(user.id || ''))
                ? Number(user.id)
                : null;

    try {
        const payload = {
            user_id: numericUserId,
            user_name: resolvedName,
            user_role: resolvedRole,
            action,
            entity_type,
            description,
            ...(created_at ? { created_at } : {})
        };

        const { error } = await supabase.from('activity_logs').insert([payload]);
        if (error) throw error;
    } catch (error) {
        console.error('Failed to log activity:', error.message);
    }
};

export const useActivityLogs = ({ page = 1, pageSize = 20, searchTerm = '', filterAction = 'ALL', filterType = 'ALL' } = {}) => {
    return useQuery({
        queryKey: ['activity-logs', page, pageSize, searchTerm, filterAction, filterType],
        queryFn: async () => {
            // 1. Calculate database OFFSET and LIMIT
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize - 1;

            // 2. Perform Database-level Pagination
            let query = supabase
                .from('activity_logs')
                .select('*', { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(startIndex, endIndex);

            // Apply Database-level Filters
            if (filterAction !== 'ALL') {
                if (filterAction === 'SCAN') {
                    query = query.in('action', ['SCAN', 'DELIVERY_LOG_SCAN']);
                } else if (filterAction === 'DELETE') {
                    query = query.in('action', ['DELETE', 'DELETE_SALE', 'DELETE_SCANNED_LOG']);
                } else if (filterAction === 'UPDATE') {
                    query = query.in('action', ['UPDATE', 'UPDATE_SALE', 'SETTLE_SALE']);
                } else {
                    query = query.eq('action', filterAction);
                }
            }

            if (filterType !== 'ALL') {
                query = query.eq('entity_type', filterType);
            }

            if (searchTerm) {
                const term = searchTerm.trim().toLowerCase();
                query = query.or(`description.ilike.%${term}%,user_name.ilike.%${term}%`);
            }

            const { data: logsData, error, count } = await query;

            if (error) throw error;

            let enrichedLogs = logsData || [];

            // 3. Optimized Color Fetch: Ask database ONLY for the users in these 20 logs
            if (enrichedLogs.length > 0) {
                const uniqueUserIds = [...new Set(enrichedLogs.map(log => log.user_id).filter(Boolean))];

                if (uniqueUserIds.length > 0) {
                    const { data: usersData } = await supabase
                        .from('users')
                        .select('id, color')
                        .in('id', uniqueUserIds); // Only fetches colors for the specific users on this page

                    // Attach the colors to the logs
                    enrichedLogs = enrichedLogs.map(log => {
                        const matchedUser = usersData?.find(u => u.id === log.user_id);
                        return {
                            ...log,
                            users: { color: matchedUser?.color || '#9CA3AF' }
                        };
                    });
                }
            }

            const totalCount = count || 0;
            const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

            return { logs: enrichedLogs, totalPages, totalCount };
        }
    });
};