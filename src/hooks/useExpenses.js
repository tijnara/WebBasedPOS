import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const EXPENSES_KEY = ['expenses'];
const CATEGORIES_KEY = ['expense-categories'];

export function useExpenses() {
    return useQuery({
        queryKey: EXPENSES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expenses')
                .select('*, users:created_by(name)')
                .order('expense_date', { ascending: false });
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

// --- NEW CATEGORY HOOKS ---

export function useExpenseCategories() {
    return useQuery({
        queryKey: CATEGORIES_KEY,
        queryFn: async () => {
            const { data, error } = await supabase.from('expense_categories').select('*').order('name');
            if (error) throw error;
            return data || [];
        },
    });
}

export function useCreateExpenseCategory() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async (categoryName) => {
            const { error } = await supabase.from('expense_categories').insert([{
                name: categoryName,
                created_by: user?.id || null
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...expenseData }) => {
            const { error } = await supabase
                .from('expenses')
                .update({
                    amount: parseFloat(expenseData.amount),
                    category: expenseData.category,
                    description: expenseData.description,
                    expense_date: expenseData.expense_date,
                })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
        },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
        },
    });
}