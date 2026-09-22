import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export const logActivity = async ({ user, action, entity_type, description }) => {
    if (!user || user.isDemo) return;

    try {
        const { error } = await supabase.from('activity_logs').insert([{
            user_id: user.id,
            user_name: user.name || user.email,
            user_role: user.role,
            action,
            entity_type,
            description
        }]);

        if (error) throw error;
    } catch (error) {
        console.error('Failed to log activity:', error.message);
    }
};

export const useActivityLogs = (limit = 500) => {
    return useQuery({
        queryKey: ['activity-logs', limit],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('activity_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;
        }
    });
};