// src/hooks/useSalary.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { toDate } from 'date-fns-tz';
import { logActivity } from './useActivityLogs';

const TIME_ZONE = 'Asia/Manila';

export function useSalaryRecords(startDate, endDate, storeId = null) {
    const userStoreId = useStore(s => s.user?.store_id);
    const targetStoreId = Number(storeId || userStoreId) || 1;

    return useQuery({
        queryKey: ['salary-records', targetStoreId, startDate, endDate],
        queryFn: async () => {
            const startUTC = startDate ? toDate(`${startDate}T00:00:00`, { timeZone: TIME_ZONE }).toISOString() : null;
            const endUTC = endDate ? toDate(`${endDate}T23:59:59.999`, { timeZone: TIME_ZONE }).toISOString() : null;

            let query = supabase
                .from('expenses')
                .select('*')
                .eq('store_id', targetStoreId)
                .eq('category', 'Salary')
                .order('expense_date', { ascending: false });

            if (startUTC) {
                query = query.gte('expense_date', startUTC);
            }
            if (endUTC) {
                query = query.lte('expense_date', endUTC);
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
            const currentUser = useStore.getState().user || user;
            const storeId = Number(currentUser?.store_id) || 1;

            const { error: expenseError } = await supabase.from('expenses').insert([{
                store_id: storeId,
                amount: parseFloat(amount),
                category: 'Salary',
                description: description || 'Salary Payout',
                expense_date: date,
                created_by: currentUser?.id || null,
                employee_name: employeeName
            }]);

            if (expenseError) throw expenseError;

            const { data: existingEmp } = await supabase
                .from('employees')
                .select('id')
                .eq('store_id', storeId)
                .eq('name', employeeName)
                .maybeSingle();

            if (!existingEmp) {
                await supabase.from('employees').insert([{
                    store_id: storeId,
                    name: employeeName,
                    default_salary: parseFloat(amount),
                    is_active: true
                }]);
            }

            logActivity({
                user: currentUser,
                action: 'CREATE',
                entity_type: 'SALARY',
                description: `Recorded salary payout of ₱${amount} for ${employeeName}`
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}

export function useProcessDeductions() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ employeeName, date, deductions = [] }) => {
            if (!deductions || deductions.length === 0) return;

            const currentUser = useStore.getState().user || user;
            const storeId = Number(currentUser?.store_id) || 1;
            const dateOnly = date.split('T')[0];
            const expensesToInsert = [];

            for (const ded of deductions) {
                const { error: paymentError } = await supabase
                    .from('debt_payments')
                    .insert([{
                        store_id: storeId,
                        debt_id: ded.debt_id,
                        amount_paid: Number(ded.amount),
                        date_paid: dateOnly
                    }]);

                if (paymentError) throw paymentError;

                expensesToInsert.push({
                    store_id: storeId,
                    amount: -Math.abs(Number(ded.amount)),
                    category: 'Salary',
                    description: `Payroll Deduction - ${ded.description || 'Employee Debt'}`,
                    expense_date: date,
                    created_by: currentUser?.id || null,
                    employee_name: employeeName
                });
            }

            if (expensesToInsert.length > 0) {
                const { error: expenseError } = await supabase
                    .from('expenses')
                    .insert(expensesToInsert);

                if (expenseError) throw expenseError;

                const totalDeducted = deductions.reduce((sum, d) => sum + Number(d.amount), 0);
                logActivity({
                    user: currentUser,
                    action: 'UPDATE',
                    entity_type: 'SALARY',
                    description: `Processed ₱${totalDeducted.toFixed(2)} in automated debt deductions for ${employeeName}`
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient.invalidateQueries({ queryKey: ['debts'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        },
    });
}