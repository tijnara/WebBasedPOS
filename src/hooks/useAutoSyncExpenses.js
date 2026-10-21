// src/hooks/useAutoSyncExpenses.js
import { useEffect, useRef } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

export function useAutoSyncExpenses({ categories, user, isFetching, createExpense, queryClient, addToast }) {
    const isSyncing = useRef(false);

    useEffect(() => {
        const syncExpenses = async () => {
            const today = new Date();
            if (!categories.length || !user || user.isDemo || isSyncing.current || isFetching) return;

            isSyncing.current = true;

            try {
                const todayStr = format(today, 'yyyy-MM-dd');
                const recurringDailyCategories = categories.filter(cat => cat.is_recurring_daily);
                let dailyCount = 0;

                if (recurringDailyCategories.length > 0) {
                    const { data: existingDaily, error: dailyError } = await supabase
                        .from('expenses')
                        .select('category')
                        .eq('expense_date', todayStr);

                    if (dailyError) throw dailyError;

                    const existingDailyNames = existingDaily?.map(e => e.category) || [];
                    const missingDaily = recurringDailyCategories.filter(
                        cat => !existingDailyNames.includes(cat.name)
                    );

                    if (missingDaily.length > 0) {
                        const insertDaily = missingDaily.map(cat =>
                            createExpense.mutateAsync({
                                amount: cat.default_amount || 0,
                                category: cat.name,
                                description: cat.default_description || `Daily ${cat.name}`,
                                expense_date: todayStr
                            })
                        );
                        await Promise.all(insertDaily);
                        dailyCount = missingDaily.length;
                    }
                }

                const recurringWeeklyCategories = categories.filter(cat => cat.is_recurring);
                let weeklyCount = 0;

                if (recurringWeeklyCategories.length > 0) {
                    const categoriesByDate = {};

                    recurringWeeklyCategories.forEach(cat => {
                        const targetDay = cat.recurring_day ?? 1;
                        const todayDay = today.getDay();
                        const daysAgo = (todayDay + 7 - targetDay) % 7;
                        const targetDate = subDays(today, daysAgo);
                        const targetDateStr = format(targetDate, 'yyyy-MM-dd');

                        if (!categoriesByDate[targetDateStr]) {
                            categoriesByDate[targetDateStr] = [];
                        }
                        categoriesByDate[targetDateStr].push(cat);
                    });

                    for (const [dateStr, cats] of Object.entries(categoriesByDate)) {
                        const { data: existingWeekly, error: weeklyError } = await supabase
                            .from('expenses')
                            .select('category')
                            .eq('expense_date', dateStr);

                        if (weeklyError) throw weeklyError;

                        const existingWeeklyNames = existingWeekly?.map(e => e.category) || [];
                        const missingWeekly = cats.filter(
                            cat => !existingWeeklyNames.includes(cat.name)
                        );

                        if (missingWeekly.length > 0) {
                            const insertWeekly = missingWeekly.map(cat =>
                                createExpense.mutateAsync({
                                    amount: cat.default_amount || 0,
                                    category: cat.name,
                                    description: cat.default_description || `Weekly ${cat.name}`,
                                    expense_date: dateStr
                                })
                            );
                            await Promise.all(insertWeekly);
                            weeklyCount += missingWeekly.length;
                        }
                    }
                }

                if (dailyCount > 0 || weeklyCount > 0) {
                    queryClient.invalidateQueries({ queryKey: ['expenses'] });
                    queryClient.invalidateQueries({ queryKey: ['expense-summary'] });

                    if (dailyCount > 0) {
                        addToast({ title: 'Daily Sync', message: `Automatically synced ${dailyCount} recurring daily expenses.`, type: 'success' });
                    }
                    if (weeklyCount > 0) {
                        addToast({ title: 'Weekly Sync', message: `Automatically synced ${weeklyCount} recurring expenses.`, type: 'success' });
                    }
                }
            } catch (err) {
                console.error("Auto-expense sync failed:", err);
            } finally {
                setTimeout(() => { isSyncing.current = false; }, 2000);
            }
        };

        syncExpenses();
    }, [categories, user, isFetching, createExpense, queryClient, addToast]);
}