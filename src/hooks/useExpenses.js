import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const EXPENSES_KEY = ['expenses'];
const CATEGORIES_KEY = ['expense-categories'];

export function useExpenses({ startDate, endDate, page = 1, pageSize = 20, searchTerm = '', category = 'All' } = {}) {
    return useQuery({
        queryKey: [...EXPENSES_KEY, startDate, endDate, page, pageSize, searchTerm, category],
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const applyFilters = (query) => {
                if (startDate) query = query.gte('expense_date', startDate);
                if (endDate) query = query.lte('expense_date', endDate);
                
                if (category && category !== 'All') {
                    query = query.eq('category', category);
                }

                if (searchTerm) {
                    query = query.ilike('description', `%${searchTerm}%`);
                }
                return query;
            };

            let mainQuery = supabase
                .from('expenses')
                .select('*, users:created_by(name)', { count: 'exact' })
                .order('expense_date', { ascending: false })
                .range(from, to);

            let sumQuery = supabase
                .from('expenses')
                .select('amount');

            mainQuery = applyFilters(mainQuery);
            sumQuery = applyFilters(sumQuery);

            const [mainRes, sumRes] = await Promise.all([mainQuery, sumQuery]);

            if (mainRes.error) throw mainRes.error;
            if (sumRes.error) throw sumRes.error;

            const totalSum = (sumRes.data || []).reduce((acc, curr) => acc + Number(curr.amount), 0);

            return {
                expenses: mainRes.data || [],
                totalCount: mainRes.count || 0,
                totalPages: Math.ceil((mainRes.count || 0) / pageSize),
                totalSum
            };
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
                expense_date: expenseData.expense_date || new Date().toISOString(),
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

export function useExpenseSummary(dateFrom, dateTo, selectedMonth) {
    return useQuery({
        // Adding the dependencies to the queryKey so it refetches when they change
        queryKey: ['expense-summary', dateFrom, dateTo, selectedMonth],
        queryFn: async () => {
            // 1. All time (Restricted to April 20, 2026 onwards as per your rules)
            const { data: allTimeData, error: allTimeError } = await supabase
                .from('expenses')
                .select('amount')
                .gte('expense_date', '2026-04-20');
            
            if (allTimeError) throw allTimeError;
            const grandTotal = allTimeData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            // 2. Selected Month
            let monthlyTotal = 0;
            if (selectedMonth) {
                // Parse the YYYY-MM string to get the start and end dates of that month
                const [year, month] = selectedMonth.split('-');
                const endDay = new Date(year, month, 0).getDate();
                
                const startOfMonthStr = `${selectedMonth}-01`;
                const endOfMonthStr = `${selectedMonth}-${endDay}`;
                
                const { data: monthData, error: monthError } = await supabase
                    .from('expenses')
                    .select('amount')
                    .gte('expense_date', startOfMonthStr)
                    .lte('expense_date', endOfMonthStr);
                
                if (monthError) throw monthError;
                monthlyTotal = monthData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
            }

            // 3. Selected Period (Driven by dateFrom and dateTo on the page)
            let weeklyTotal = 0;
            if (dateFrom && dateTo) {
                const { data: weekData, error: weekError } = await supabase
                    .from('expenses')
                    .select('amount')
                    .gte('expense_date', dateFrom)
                    .lte('expense_date', dateTo);
                
                if (weekError) throw weekError;
                weeklyTotal = weekData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
            }

            return {
                weeklyTotal,
                monthlyTotal,
                grandTotal
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
        mutationFn: async ({ name, default_amount, default_description, is_recurring }) => {
            const { error } = await supabase.from('expense_categories').insert([{
                name,
                default_amount: default_amount ? parseFloat(default_amount) : null,
                default_description: default_description || null,
                is_recurring: !!is_recurring,
                created_by: user?.id || null
            }]);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
        },
    });
}

export function useUpdateExpenseCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, default_amount, default_description, is_recurring }) => {
            const { error } = await supabase
                .from('expense_categories')
                .update({
                    name,
                    default_amount: default_amount ? parseFloat(default_amount) : null,
                    default_description: default_description || null,
                    is_recurring: !!is_recurring
                })
                .eq('id', id);
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