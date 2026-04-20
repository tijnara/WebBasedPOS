import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const EXPENSES_KEY = ['expenses'];

export function useExpenses() {
    return useQuery({
        queryKey: EXPENSES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
            if (error) throw error;
            return data || [];
        },
    });
}

export function useCreateExpense() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async (expenseData) => {
            const payload = {
                amount: parseFloat(expenseData.amount),
                category: expenseData.category,
                description: expenseData.description,
                created_by: user?.id || null,
            };
            const { error } = await supabase.from('expenses').insert([payload]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
        },
    });
}

export function useExpenseSummary() {
    return useQuery({
        queryKey: ['expense-summary'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_expense_summary');
            if (error) throw error;
            return {
                dailyTotal: Number(data.dailyTotal || 0),
                weeklyTotal: Number(data.weeklyTotal || 0),
                monthlyTotal: Number(data.monthlyTotal || 0),
                grandTotal: Number(data.grandTotal || 0)
            };
        },
        staleTime: 1000 * 60 * 3,
    });
}