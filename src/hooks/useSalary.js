// src/hooks/useSalary.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

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
            const dateIso = new Date(date).toISOString();

            // ONLY records the manual Gross Salary
            const { error: expenseError } = await supabase.from('expenses').insert([{
                amount: parseFloat(amount),
                category: 'Salary',
                description: description || 'Salary Payout',
                expense_date: dateIso,
                created_by: user?.id || null,
                employee_name: employeeName
            }]);

            if (expenseError) throw expenseError;

            await supabase.from('employees').upsert(
                { name: employeeName, default_salary: parseFloat(amount) },
                { onConflict: 'name', ignoreDuplicates: true }
            );
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['employees'] });
        },
    });
}

// NEW: Hook specifically for processing automated debt deductions against existing salary history
export function useProcessDeductions() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ employeeName, date, deductions = [] }) => {
            if (!deductions || deductions.length === 0) return;

            const dateIso = new Date(date).toISOString();
            const dateOnly = dateIso.split('T')[0];
            const expensesToInsert = [];

            for (const ded of deductions) {
                // Record debt payment to reduce their debt balance
                await supabase.from('debt_payments').insert([{
                    debt_id: ded.debt_id,
                    amount_paid: ded.amount,
                    date_paid: dateOnly
                }]);

                // Add the negative expense (inflow)
                expensesToInsert.push({
                    amount: -Math.abs(ded.amount),
                    category: 'Debt Repayment',
                    description: `Auto-deduction for: ${ded.description} (Adds to Net)`,
                    expense_date: dateIso,
                    created_by: user?.id || null,
                    employee_name: employeeName
                });
            }

            if (expensesToInsert.length > 0) {
                const { error: expenseError } = await supabase.from('expenses').insert(expensesToInsert);
                if (expenseError) throw expenseError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        },
    });
}