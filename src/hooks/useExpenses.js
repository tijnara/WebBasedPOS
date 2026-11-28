// src/hooks/useExpenses.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';

const EXPENSES_KEY = ['expenses'];
const CATEGORIES_KEY = ['expense-categories'];

// Asia/Manila (UTC+8) start/end boundary helpers
const getManilaStartOfDay = (dateStr) => {
    const clean = String(dateStr || '').trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        return new Date(`${clean}T00:00:00+08:00`).toISOString();
    }
    return new Date(dateStr).toISOString();
};

const getManilaEndOfDay = (dateStr) => {
    const clean = String(dateStr || '').trim().slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
        return new Date(`${clean}T23:59:59.999+08:00`).toISOString();
    }
    const date = new Date(dateStr);
    date.setUTCHours(23, 59, 59, 999);
    return date.toISOString();
};

const parseRecurringDay = (value) => {
    const parsed = Number.parseInt(String(value ?? 1), 10);
    return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : 1;
};

export function useExpenses({
                                startDate,
                                endDate,
                                page = 1,
                                pageSize = 20,
                                searchTerm = '',
                                category = 'All',
                                employeeName = 'all',
                                storeId = null
                            } = {}) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: [...EXPENSES_KEY, targetStoreId, startDate, endDate, page, pageSize, searchTerm, category, employeeName],
        queryFn: async () => {
            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;

            const applyFilters = (query) => {
                query = query.eq('store_id', targetStoreId);

                if (startDate) query = query.gte('expense_date', getManilaStartOfDay(startDate));
                if (endDate) query = query.lte('expense_date', getManilaEndOfDay(endDate));

                if (category && category !== 'All') {
                    query = query.eq('category', category);
                }

                if (employeeName && employeeName !== 'all') {
                    query = query.eq('employee_name', employeeName);
                }

                if (searchTerm) {
                    query = query.ilike('description', `%${searchTerm}%`);
                }
                return query;
            };

            let mainQuery = supabase
                .from('expenses')
                .select('*, users:created_by(name, color)', { count: 'exact' })
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

            const expenses = (mainRes.data || []).map(e => ({
                ...e,
                staffName: e.users?.name || 'Unknown',
                userColor: e.users?.color || '#374151',
            }));

            return {
                expenses,
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
            const currentUser = useStore.getState().user;
            const storeId = Number(expenseData.store_id || currentUser?.store_id || user?.store_id) || 1;

            const rawDate = String(expenseData.expense_date || '').trim();
            const normalizedIso = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                ? new Date(`${rawDate}T12:00:00+08:00`).toISOString()
                : new Date(rawDate).toISOString();

            const payload = {
                store_id: storeId,
                amount: parseFloat(expenseData.amount),
                category: expenseData.category,
                description: expenseData.description,
                expense_date: normalizedIso,
                created_by: expenseData.created_by ?? user?.id ?? null,
                employee_name: expenseData.employee_name || null
            };
            const { error } = await supabase.from('expenses').insert([payload]);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'EXPENSE',
                description: `Recorded expense of ₱${payload.amount} for ${payload.category} (${payload.description})`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useExpenseSummary(dateFrom, dateTo, selectedMonth, storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['expense-summary', targetStoreId, dateFrom, dateTo, selectedMonth],
        queryFn: async () => {
            const { data: allTimeData, error: allTimeError } = await supabase
                .from('expenses')
                .select('amount')
                .eq('store_id', targetStoreId)
                .gte('expense_date', '2026-04-20T00:00:00+08:00');

            if (allTimeError) throw allTimeError;
            const grandTotal = allTimeData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

            let monthlyTotal = 0;
            if (selectedMonth) {
                const [year, month] = selectedMonth.split('-');
                const endDay = String(new Date(Number(year), Number(month), 0).getDate()).padStart(2, '0');

                const startOfMonthStr = `${selectedMonth}-01`;
                const endOfMonthStr = `${selectedMonth}-${endDay}`;

                const { data: monthData, error: monthError } = await supabase
                    .from('expenses')
                    .select('amount')
                    .eq('store_id', targetStoreId)
                    .gte('expense_date', getManilaStartOfDay(startOfMonthStr))
                    .lte('expense_date', getManilaEndOfDay(endOfMonthStr));

                if (monthError) throw monthError;
                monthlyTotal = monthData?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
            }

            let weeklyTotal = 0;
            if (dateFrom && dateTo) {
                const { data: weekData, error: weekError } = await supabase
                    .from('expenses')
                    .select('amount')
                    .eq('store_id', targetStoreId)
                    .gte('expense_date', getManilaStartOfDay(dateFrom))
                    .lte('expense_date', getManilaEndOfDay(dateTo));

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

// --- CATEGORY HOOKS ---

export function useExpenseCategories(storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: [...CATEGORIES_KEY, targetStoreId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('expense_categories')
                .select('*')
                .eq('store_id', targetStoreId)
                .order('name');
            if (error) throw error;
            return (data || []).filter(
                (cat) => String(cat?.name || '').trim().toLowerCase() !== 'maintenance'
            );
        },
    });
}

export function useCreateExpenseCategory() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ name, default_amount, default_description, is_recurring, is_recurring_daily, recurring_day }) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id || user?.store_id) || 1;

            const { error } = await supabase.from('expense_categories').insert([{
                store_id: storeId,
                name,
                default_amount: default_amount ? parseFloat(default_amount) : null,
                default_description: default_description || null,
                is_recurring: !!is_recurring,
                is_recurring_daily: !!is_recurring_daily,
                recurring_day: parseRecurringDay(recurring_day),
                created_by: user?.id || null
            }]);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'CATEGORY',
                description: `Created new expense category: ${name}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useUpdateExpenseCategory() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, name, default_amount, default_description, is_recurring, is_recurring_daily, recurring_day }) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;

            const { error } = await supabase
                .from('expense_categories')
                .update({
                    name,
                    default_amount: default_amount ? parseFloat(default_amount) : null,
                    default_description: default_description || null,
                    is_recurring: !!is_recurring,
                    is_recurring_daily: !!is_recurring_daily,
                    recurring_day: parseRecurringDay(recurring_day)
                })
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'CATEGORY',
                description: `Updated expense category: ${name}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: CATEGORIES_KEY });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useUpdateExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ id, ...expenseData }) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;

            const rawDate = String(expenseData.expense_date || '').trim();
            const normalizedIso = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
                ? new Date(`${rawDate}T12:00:00+08:00`).toISOString()
                : new Date(rawDate).toISOString();

            const { error } = await supabase
                .from('expenses')
                .update({
                    amount: parseFloat(expenseData.amount),
                    category: expenseData.category,
                    description: expenseData.description,
                    expense_date: normalizedIso,
                    employee_name: expenseData.employee_name || null
                })
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            logActivity({
                user: currentUser,
                action: 'UPDATE',
                entity_type: 'EXPENSE',
                description: `Updated expense details for ${expenseData.category} (₱${expenseData.amount})`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useDeleteExpense() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (id) => {
            const currentUser = useStore.getState().user;
            const storeId = Number(currentUser?.store_id) || 1;

            const { data: expenseToDelete } = await supabase
                .from('expenses')
                .select('category, amount, description')
                .eq('id', id)
                .eq('store_id', storeId)
                .single();

            const { error } = await supabase
                .from('expenses')
                .delete()
                .eq('id', id)
                .eq('store_id', storeId);
            if (error) throw error;

            if (expenseToDelete) {
                logActivity({
                    user: currentUser,
                    action: 'DELETE',
                    entity_type: 'EXPENSE',
                    description: `Deleted expense: ${expenseToDelete.category} (₱${expenseToDelete.amount})`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: EXPENSES_KEY });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}