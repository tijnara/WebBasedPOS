// src/hooks/useEmployees.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// 1. Fetches all active employees to populate your dropdown and table
export function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                // .eq('is_active', true) // Temporarily disabled for diagnostics
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        }
    });
}

// 2. Handles Adding, Editing, and Deleting from the Manage Employees modal
export function useManageEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ action, employee }) => {
            if (action === 'ADD') {
                const { error } = await supabase.from('employees').insert([{ 
                    name: employee.name, 
                    default_salary: parseFloat(employee.default_salary || 0),
                    is_active: true
                }]);
                if (error) throw error;
            } 
            else if (action === 'EDIT') {
                const { error } = await supabase.from('employees')
                    .update({ 
                        name: employee.name, 
                        default_salary: parseFloat(employee.default_salary || 0) 
                    })
                    .eq('id', employee.id);
                if (error) throw error;
            } 
            else if (action === 'DELETE') {
                // Hard deletes the employee record
                const { error } = await supabase.from('employees').delete().eq('id', employee.id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            // Automatically refreshes the UI after a change is made
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
    });
}