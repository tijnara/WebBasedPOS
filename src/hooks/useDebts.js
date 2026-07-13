// src/hooks/useDebts.js
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { useStore } from '../store/useStore';

const DEBTS_KEY = ['debts'];

export function useDebts() {
    const isDemo = useStore(s => s.user?.isDemo);

    return useQuery({
        queryKey: DEBTS_KEY,
        queryFn: async () => {
            if (isDemo) {
                return [
                    {
                        id: 101,
                        debt_date: '2026-04-10',
                        description: 'Delivery Truck Financing',
                        total_debt_amount: 250000.00,
                        weekly_payment_amount: 15000.00,
                        frequency: 'Weekly',
                        type: 'company',
                        debt_payments: [
                            { id: 1, amount_paid: 15000.00, date_paid: '2026-04-17' },
                            { id: 2, amount_paid: 15000.00, date_paid: '2026-04-24' }
                        ]
                    },
                    {
                        id: 102,
                        debt_date: '2026-06-01',
                        description: 'Office Renovation Materials',
                        total_debt_amount: 80000.00,
                        weekly_payment_amount: 5000.00,
                        frequency: 'Every 15 days',
                        type: 'company',
                        debt_payments: []
                    },
                    {
                        id: 103,
                        debt_date: '2026-07-01',
                        description: 'John Doe - Cash Advance',
                        total_debt_amount: 5000.00,
                        weekly_payment_amount: 500.00,
                        frequency: 'Weekly',
                        type: 'employee',
                        debt_payments: []
                    }
                ];
            }

            const { data, error } = await supabase
                .from('debts')
                .select('*, debt_payments(id, amount_paid, date_paid)')
                .order('debt_date', { ascending: false });

            if (error) throw error;
            return data || [];
        }
    });
}

export function useCreateDebt() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newDebt) => {
            const { data, error } = await supabase
                .from('debts')
                .insert([newDebt])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEBTS_KEY });
        }
    });
}

export function useCreateDebtPayment() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (newPayment) => {
            const { data, error } = await supabase
                .from('debt_payments')
                .insert([newPayment])
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: DEBTS_KEY });
        }
    });
}