// src/hooks/useSalary.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';
import { toDate } from 'date-fns-tz';

const TIME_ZONE = 'Asia/Manila';

export function useSalaryRecords(startDate, endDate) {
    return useQuery({
        queryKey: ['salary-records', startDate, endDate],
        queryFn: async () => {
            // Ensure start and end dates are treated as being in the Manila timezone
            const startUTC = startDate ? toDate(`${startDate}T00:00:00`, { timeZone: TIME_ZONE }).toISOString() : null;
            const endUTC = endDate ? toDate(`${endDate}T23:59:59.999`, { timeZone: TIME_ZONE }).toISOString() : null;

            let query = supabase
                .from('expenses')
                .select('*')
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
            // The 'date' is already a UTC ISO string from the frontend
            const { error: expenseError } = await supabase.from('expenses').insert([{
                amount: parseFloat(amount),
                category: 'Salary',
                description: description || 'Salary Payout',
                expense_date: date,
                created_by: user?.id || null,
                employee_name: employeeName
            }]);

            if (expenseError) throw expenseError;

            // This part doesn't need timezone conversion
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

export function useProcessDeductions() {
    const queryClient = useQueryClient();
    const user = useStore(s => s.user);

    return useMutation({
        mutationFn: async ({ employeeName, date, deductions = [] }) => {
            if (!deductions || deductions.length === 0) return;

            // The 'date' is already a UTC ISO string from the frontend
            const dateOnly = date.split('T')[0];
            const expensesToInsert = [];

            for (const ded of deductions) {
                // Record debt payment to reduce their debt balance
                await supabase.from('debt_payments').insert([{
                    debt_id: ded.debt_id,
                    amount_paid: ded.amount,
                    date_paid: dateOnly // date_paid is a 'date' column, so time part is not needed
                }]);

                // Add the negative salary entry
                expensesToInsert.push({
                    amount: -Math.abs(ded.amount),
                    category: 'Salary',
                    description: `Deduction: ${ded.description}`,
                    expense_date: date, // Use the full ISO string for the 'timestampz' column
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
            queryClient.invalidateQueries({ queryKey: ['salary-records'] });
            queryClient.invalidateQueries({ queryKey: ['expenses'] });
            queryClient.invalidateQueries({ queryKey: ['expense-summary'] });
            queryClient.invalidateQueries({ queryKey: ['debts'] });
        },
    });
}