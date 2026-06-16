// src/hooks/useSalary.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

// Updated to accept dates
export function useSalaryRecords(startDate, endDate) {
    return useQuery({
        queryKey: ['salary-records', startDate, endDate],
        queryFn: async () => {
            let query = supabase
                .from('expenses')
                .select('*')
                .eq('category', 'Salary')
                .order('expense_date', { ascending: false });
            
            if (startDate) {
                query = query.gte('expense_date', `${startDate}T00:00:00`);
            }
            if (endDate) {
                query = query.lte('expense_date', `${endDate}T23:59:59.999`);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            return data || [];
        }
    });
}

export function useCreateSalary() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ employeeName, amount, description, date }) => {
            const { error } = await supabase.from('expenses').insert([{
                amount: parseFloat(amount),
                category: 'Salary',
                description: description || 'Salary Payout',
                expense_date: new Date(date).toISOString(),
                created_by: user?.id,
                employee_name: employeeName
            }]);
            
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
        },
    });
}