// src/hooks/useEmployees.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

export function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .eq('is_active', true)
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        }
    });
}