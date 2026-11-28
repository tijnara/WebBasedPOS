// src/hooks/useAutoSyncExpenses.js
import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabaseClient';

const STORAGE_PREFIX = 'seaside_expense_autosync_v2:';
const MANILA_TIME_ZONE = 'Asia/Manila';

const WEEKDAY_SHORT_TO_INDEX = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
};

export function getManilaNowParts(dateObj = new Date()) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: MANILA_TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        }).formatToParts(dateObj);

        const map = {};
        for (const p of parts) {
            if (p.type !== 'literal') map[p.type] = p.value;
        }

        const year = Number(map.year);
        const month = Number(map.month);
        const day = Number(map.day);
        const dayOfWeek =
            WEEKDAY_SHORT_TO_INDEX[map.weekday] ??
            new Date(Date.UTC(year, month - 1, day)).getUTCDay();

        return {
            year,
            month,
            day,
            dayOfWeek,
            dateStr: `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            hour: String(map.hour || '08').padStart(2, '0'),
            minute: String(map.minute || '00').padStart(2, '0'),
            second: String(map.second || '00').padStart(2, '0')
        };
    } catch {
        const fallbackStr = format(dateObj, 'yyyy-MM-dd');
        const [y, m, d] = fallbackStr.split('-').map(Number);
        return {
            year: y,
            month: m,
            day: d,
            dayOfWeek: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
            dateStr: fallbackStr,
            hour: String(dateObj.getHours()).padStart(2, '0'),
            minute: String(dateObj.getMinutes()).padStart(2, '0'),
            second: String(dateObj.getSeconds()).padStart(2, '0')
        };
    }
}

export function getManilaDateString(dateObj = new Date()) {
    return getManilaNowParts(dateObj).dateStr;
}

// Monday = 1 .. Saturday = 6, Sunday = 0 (last day of the week)
function getManilaWeekDateForDay(recurringDay, manilaNow) {
    const normalizedTarget =
        Number.isInteger(Number(recurringDay)) && Number(recurringDay) >= 0 && Number(recurringDay) <= 6
            ? Number(recurringDay)
            : 1;

    const offsetFromMonday = (normalizedTarget + 6) % 7;
    const daysSinceMonday = (manilaNow.dayOfWeek + 6) % 7;
    const mondayUtc = new Date(
        Date.UTC(manilaNow.year, manilaNow.month - 1, manilaNow.day - daysSinceMonday)
    );
    const targetUtc = new Date(
        Date.UTC(
            mondayUtc.getUTCFullYear(),
            mondayUtc.getUTCMonth(),
            mondayUtc.getUTCDate() + offsetFromMonday
        )
    );

    return targetUtc.toISOString().slice(0, 10);
}

function hasSyncedMarker(key) {
    if (typeof window === 'undefined') return false;
    try {
        return window.localStorage.getItem(`${STORAGE_PREFIX}${key}`) === '1';
    } catch {
        return false;
    }
}

function markSyncedMarker(key) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, '1');
    } catch {
        // Ignore storage restrictions
    }
}

export function clearSyncedMarker(key) {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
    } catch {
        // Ignore storage restrictions
    }
}

export function clearAutoSyncMarkersForExpense(exp, storeId = null) {
    if (!exp?.category || typeof window === 'undefined') return;
    const catName = String(exp.category).trim();
    const resolvedStoreId = Number(storeId || exp.store_id) || 1;
    const manilaNow = getManilaNowParts(new Date());
    let dateStr = manilaNow.dateStr;

    if (exp.expense_date) {
        const raw = String(exp.expense_date).trim();
        const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw)
            ? `${raw}T12:00:00+08:00`
            : raw;
        const parsed = new Date(normalized);
        if (!Number.isNaN(parsed.getTime())) {
            dateStr = getManilaDateString(parsed);
        }
    }

    clearSyncedMarker(`store:${resolvedStoreId}:daily:${dateStr}:${catName}`);
    clearSyncedMarker(`store:${resolvedStoreId}:weekly:${dateStr}:${catName}`);
    clearSyncedMarker(`daily:${dateStr}:${catName}`);
    clearSyncedMarker(`weekly:${dateStr}:${catName}`);

    try {
        const keysToRemove = [];
        for (let i = 0; i < window.localStorage.length; i += 1) {
            const fullKey = window.localStorage.key(i);
            if (
                fullKey &&
                fullKey.startsWith(`${STORAGE_PREFIX}store:${resolvedStoreId}:`) &&
                fullKey.endsWith(`:${catName}`)
            ) {
                keysToRemove.push(fullKey);
            }
        }
        keysToRemove.forEach((k) => window.localStorage.removeItem(k));
    } catch {
        // Ignore storage restrictions
    }
}

async function hasExistingExpenseOnManilaDate(categoryName, dateStr, storeId) {
    const dayStart = `${dateStr}T00:00:00.000+08:00`;
    const dayEnd = `${dateStr}T23:59:59.999+08:00`;

    const { data, error } = await supabase
        .from('expenses')
        .select('id, category, expense_date')
        .eq('store_id', storeId)
        .eq('category', categoryName)
        .gte('expense_date', dayStart)
        .lte('expense_date', dayEnd)
        .limit(1);

    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
}

export function useAutoSyncExpenses({
                                        categories,
                                        user,
                                        isFetching,
                                        createExpense,
                                        queryClient,
                                        addToast,
                                        syncTick = 0
                                    }) {
    const isSyncingRef = useRef(false);

    const createExpenseRef = useRef(createExpense);
    const queryClientRef = useRef(queryClient);
    const addToastRef = useRef(addToast);

    useEffect(() => {
        createExpenseRef.current = createExpense;
        queryClientRef.current = queryClient;
        addToastRef.current = addToast;
    }, [createExpense, queryClient, addToast]);

    const userId = user?.id ?? null;
    const storeId = Number(user?.store_id) || 1;
    const isDemo = Boolean(user?.isDemo);
    const categoriesSignature = Array.isArray(categories)
        ? categories
            .map(
                (c) =>
                    `${c?.id ?? c?.name}:${c?.is_recurring_daily ? 1 : 0}:${c?.is_recurring ? 1 : 0}:${c?.recurring_day ?? 1}:${c?.default_amount ?? 0}`
            )
            .join('|')
        : '';

    useEffect(() => {
        if (!categoriesSignature || !userId || isDemo || isFetching || isSyncingRef.current) {
            return;
        }

        isSyncingRef.current = true;
        let cancelled = false;

        const syncExpenses = async () => {
            try {
                const eligibleCategories = (categories || []).filter(
                    (cat) => cat?.name && String(cat.name).trim().toLowerCase() !== 'maintenance'
                );

                const manilaNow = getManilaNowParts(new Date());
                const todayStr = manilaNow.dateStr;

                const recurringDailyCategories = eligibleCategories.filter((cat) => Boolean(cat.is_recurring_daily));
                let dailyCount = 0;

                for (const cat of recurringDailyCategories) {
                    if (cancelled) break;
                    const key = `store:${storeId}:daily:${todayStr}:${cat.name}`;
                    if (hasSyncedMarker(key)) continue;

                    const exists = await hasExistingExpenseOnManilaDate(cat.name, todayStr, storeId);
                    if (exists) {
                        markSyncedMarker(key);
                        continue;
                    }

                    markSyncedMarker(key);
                    try {
                        await createExpenseRef.current.mutateAsync({
                            store_id: storeId,
                            amount: Number(cat.default_amount) || 0,
                            category: cat.name,
                            description: cat.default_description || `Daily ${cat.name}`,
                            expense_date: `${todayStr}T08:00:00+08:00`,
                            created_by: userId
                        });
                        dailyCount += 1;
                    } catch (err) {
                        clearSyncedMarker(key);
                        throw err;
                    }
                }

                const recurringWeeklyCategories = eligibleCategories.filter((cat) => Boolean(cat.is_recurring));
                let weeklyCount = 0;

                if (recurringWeeklyCategories.length > 0) {
                    const categoriesByDate = {};

                    recurringWeeklyCategories.forEach((cat) => {
                        const targetDateStr = getManilaWeekDateForDay(cat.recurring_day ?? 1, manilaNow);
                        if (!categoriesByDate[targetDateStr]) {
                            categoriesByDate[targetDateStr] = [];
                        }
                        categoriesByDate[targetDateStr].push(cat);
                    });

                    for (const [dateStr, cats] of Object.entries(categoriesByDate)) {
                        if (cancelled) break;

                        for (const cat of cats) {
                            if (cancelled) break;
                            const key = `store:${storeId}:weekly:${dateStr}:${cat.name}`;
                            if (hasSyncedMarker(key)) continue;

                            const exists = await hasExistingExpenseOnManilaDate(cat.name, dateStr, storeId);
                            if (exists) {
                                markSyncedMarker(key);
                                continue;
                            }

                            markSyncedMarker(key);
                            try {
                                await createExpenseRef.current.mutateAsync({
                                    store_id: storeId,
                                    amount: Number(cat.default_amount) || 0,
                                    category: cat.name,
                                    description: cat.default_description || `Weekly ${cat.name}`,
                                    expense_date: `${dateStr}T08:00:00+08:00`,
                                    created_by: userId
                                });
                                weeklyCount += 1;
                            } catch (err) {
                                clearSyncedMarker(key);
                                throw err;
                            }
                        }
                    }
                }

                if (!cancelled && (dailyCount > 0 || weeklyCount > 0)) {
                    await Promise.all([
                        queryClientRef.current?.invalidateQueries({ queryKey: ['expenses'] }),
                        queryClientRef.current?.invalidateQueries({ queryKey: ['expense-summary'] })
                    ]);

                    if (dailyCount > 0) {
                        addToastRef.current?.({
                            title: 'Daily Sync',
                            message: `Automatically synced ${dailyCount} recurring daily expenses.`,
                            type: 'success'
                        });
                    }
                    if (weeklyCount > 0) {
                        addToastRef.current?.({
                            title: 'Weekly Sync',
                            message: `Automatically synced ${weeklyCount} recurring expenses.`,
                            type: 'success'
                        });
                    }
                }
            } catch (err) {
                console.error('Auto-expense sync failed:', err);
            } finally {
                isSyncingRef.current = false;
            }
        };

        syncExpenses();

        return () => {
            cancelled = true;
        };
    }, [categoriesSignature, userId, storeId, isDemo, isFetching, syncTick, categories]);
}