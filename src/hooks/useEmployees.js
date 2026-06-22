// src/hooks/useEmployees.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';

// 1. Fetch all employees
export function useEmployees() {
    return useQuery({
        queryKey: ['employees'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('employees')
                .select('*')
                .order('name', { ascending: true });
            
            if (error) throw error;
            return data || [];
        }
    });
}

// 2. Add, Edit, or Delete an employee
export function useManageEmployee() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ action, employee }) => {
            if (action === 'ADD') {
                const { error } = await supabase.from('employees').insert([{ 
                    name: employee.name, 
                    default_salary: parseFloat(employee.default_salary || 0) 
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
                const { error } = await supabase.from('employees').delete().eq('id', employee.id);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        }
    });
}