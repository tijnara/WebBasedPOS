// src/hooks/useVehicles.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { addMonths, addDays, isSameDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { FILTER_CONFIG } from '../config/constants';

/**
 * Determines whether a target due date is within the 24-hour (1 whole day) alert window.
 * Matches if:
 * 1. Target date is today (12:00am to 11:59pm - same calendar day)
 * 2. Target date was reached within the last 24 hours (0 to 24 hours elapsed)
 */
export const isWithin24HoursOfDate = (now, targetDate) => {
    if (!targetDate) return false;
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) return false;

    // Check 1: Same calendar day (12:00am to 11:59pm)
    if (isSameDay(now, target)) return true;

    // Check 2: Within 24 hours of target timestamp (0 to 24 hours elapsed)
    const diffMs = now.getTime() - target.getTime();
    if (diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000) return true;

    return false;
};

function buildManilaTargetDate(dateStr, timeStr = '09:00') {
    const cleanDate = String(dateStr || '').trim().slice(0, 10);
    const cleanTime = /^\d{2}:\d{2}/.test(String(timeStr || '').trim())
        ? String(timeStr).trim().slice(0, 5)
        : '09:00';

    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) return null;
    const target = new Date(`${cleanDate}T${cleanTime}:00+08:00`);
    return Number.isNaN(target.getTime()) ? null : target;
}

export function useVehicles() {
    const user = useStore(s => s.user);
    const isDemo = user?.isDemo;

    return useQuery({
        queryKey: ['vehicles', user?.id, isDemo],
        queryFn: async () => {
            if (!user || isDemo) return [];
            const { data, error } = await supabase.from('vehicles').select('*').order('created_at', { ascending: true });
            if (error) throw error;
            return data || [];
        },
        enabled: !!user && !isDemo
    });
}

export function useMaintenanceAlerts() {
    const user = useStore(s => s.user);
    const isDemo = user?.isDemo;

    return useQuery({
        queryKey: ['maintenance-alerts', user?.id, isDemo],
        queryFn: async () => {
            if (!user || isDemo) {
                return {
                    dueVehicles: [],
                    dueFilters: [],
                    overdueVehicles: [],
                    overdueFilters: [],
                    dueSoonFilters: [],
                    dueSoonVehicles: [],
                    allVehicles: [],
                    allFilters: [],
                    waterTestAlert: null,
                    hasDueAlerts: false,
                    hasOverdue: false
                };
            }

            const [vehiclesRes, historyRes, configsRes, waterTestRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
                supabase.from('maintenance_history').select('*').order('replaced_at', { ascending: false }),
                supabase.from('filter_configs').select('*'),
                supabase.from('water_test_schedules').select('*').eq('id', 1).maybeSingle()
            ]);

            if (vehiclesRes.error) throw vehiclesRes.error;
            if (historyRes.error) throw historyRes.error;

            const dbVehicles = vehiclesRes.data || [];
            const history = historyRes.data || [];
            const dbConfigs = !configsRes.error && Array.isArray(configsRes.data) ? configsRes.data : [];

            const latestDates = {};
            history.forEach(record => {
                if (!latestDates[record.item_id]) {
                    latestDates[record.item_id] = record.replaced_at;
                }
            });

            const now = new Date();

            // 1. Process Vehicles
            const processedVehicles = dbVehicles.map(vehicle => {
                const lastReplaced = latestDates[vehicle.id]
                    ? new Date(latestDates[vehicle.id])
                    : new Date(vehicle.created_at || now);
                const totalLifespanDays = Number(
                    vehicle.lifespan_days || (vehicle.lifespan_months ? vehicle.lifespan_months * 30 : 180)
                );
                const dueDate = addDays(lastReplaced, totalLifespanDays);
                const daysPassed = Math.max(0, Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24)));
                const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
                const isOverdue = daysLeft === 0;
                const isDueSoon = !isOverdue && daysLeft <= 7;
                const isDueWithin24h = isOverdue && isWithin24HoursOfDate(now, dueDate);

                return {
                    ...vehicle,
                    lastReplaced,
                    dueDate,
                    daysPassed,
                    daysLeft,
                    totalLifespanDays,
                    isOverdue,
                    isDueSoon,
                    isDueWithin24h
                };
            });

            const overdueVehicles = processedVehicles.filter(v => v.isOverdue);
            const dueSoonVehicles = processedVehicles.filter(v => v.isDueSoon);
            const dueVehicles = processedVehicles.filter(v => v.isDueWithin24h);

            // 2. Process Filters (incorporating filter_configs overrides)
            const activeFilters = FILTER_CONFIG.map(defaultFilter => {
                const matched = dbConfigs.find(c => String(c.id) === String(defaultFilter.id));
                if (!matched) return defaultFilter;
                return {
                    ...defaultFilter,
                    name: matched.name || defaultFilter.name,
                    lifespanDays: matched.lifespan_days ?? defaultFilter.lifespanDays,
                    containerLimit: matched.container_limit ?? defaultFilter.containerLimit,
                    containersText: Number(matched.container_limit ?? defaultFilter.containerLimit).toLocaleString(),
                    cost: matched.cost ? Number(matched.cost) : defaultFilter.cost
                };
            });

            const filterPromises = activeFilters.map(async (filter) => {
                const lastReplaced = latestDates[filter.id] ? new Date(latestDates[filter.id]) : new Date();
                const timeDueDate = addDays(lastReplaced, filter.lifespanDays);
                const daysPassed = Math.max(0, Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24)));
                const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
                const isTimeOverdue = daysLeft === 0;
                const isTimeDueSoon = !isTimeOverdue && daysLeft <= 3;
                const isTimeDueWithin24h = isTimeOverdue && isWithin24HoursOfDate(now, timeDueDate);

                let containersSold = 0;
                let limitReachedAt = null;

                if (latestDates[filter.id]) {
                    const { data: salesData, error: salesError } = await supabase
                        .from('sale_items')
                        .select('quantity, sales!inner(saletimestamp, status)')
                        .in('product_id', [2, 3, 30])
                        .eq('sales.status', 'Completed')
                        .gte('sales.saletimestamp', latestDates[filter.id]);

                    if (salesError) throw salesError;

                    if (salesData && salesData.length > 0) {
                        const sortedSales = [...salesData].sort((a, b) =>
                            new Date(a.sales?.saletimestamp || 0) - new Date(b.sales?.saletimestamp || 0)
                        );
                        let runningTotal = 0;
                        for (const item of sortedSales) {
                            runningTotal += (item.quantity || 0);
                            if (runningTotal >= filter.containerLimit && !limitReachedAt) {
                                limitReachedAt = new Date(item.sales?.saletimestamp || Date.now());
                            }
                        }
                        containersSold = runningTotal;
                    }
                }

                const isUsageOverdue = containersSold >= filter.containerLimit;
                const isUsageDueWithin24h = isUsageOverdue && (
                    limitReachedAt
                        ? isWithin24HoursOfDate(now, limitReachedAt)
                        : isWithin24HoursOfDate(now, lastReplaced)
                );

                const isOverdue = isTimeOverdue || isUsageOverdue;
                const isDueSoon = !isOverdue && isTimeDueSoon;
                const isDueWithin24h = isTimeDueWithin24h || isUsageDueWithin24h;
                const containersLeft = Math.max(0, filter.containerLimit - containersSold);

                let reason = '';
                if (isTimeOverdue && isUsageOverdue) {
                    reason = `Time & usage limit reached (${containersSold}/${filter.containersText} containers)`;
                } else if (isUsageOverdue) {
                    reason = `Limit reached (${containersSold}/${filter.containersText} containers)`;
                } else if (isTimeOverdue) {
                    reason = `Lifespan reached (${filter.lifespanDays} days)`;
                } else if (isTimeDueSoon) {
                    reason = `${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining`;
                }

                return {
                    ...filter,
                    lastReplaced,
                    timeDueDate,
                    limitReachedAt,
                    daysPassed,
                    daysLeft,
                    containersSold,
                    containersLeft,
                    isTimeOverdue,
                    isUsageOverdue,
                    isOverdue,
                    isDueSoon,
                    isTimeDueWithin24h,
                    isUsageDueWithin24h,
                    isDueWithin24h,
                    reason
                };
            });

            const processedFilters = await Promise.all(filterPromises);
            const overdueFilters = processedFilters.filter(f => f.isOverdue);
            const dueSoonFilters = processedFilters.filter(f => f.isDueSoon);
            const dueFilters = processedFilters.filter(f => f.isDueWithin24h);
            const goodFilters = processedFilters.filter(f => !f.isDueWithin24h && !f.isOverdue);
            const notDueFilters = processedFilters.filter(f => !f.isDueWithin24h);

            // 3. Process Water Test Schedule
            let waterTestSchedule = !waterTestRes.error && waterTestRes.data ? waterTestRes.data : null;
            if (!waterTestSchedule && typeof window !== 'undefined') {
                try {
                    const cached = localStorage.getItem('seaside_water_test_schedule');
                    if (cached) waterTestSchedule = JSON.parse(cached);
                } catch {
                    // Ignore parse error
                }
            }

            let waterTestAlert = null;
            if (waterTestSchedule?.next_test_date) {
                const targetDate = buildManilaTargetDate(
                    waterTestSchedule.next_test_date,
                    waterTestSchedule.test_time || '09:00'
                );

                if (targetDate) {
                    const diffMs = targetDate.getTime() - now.getTime();
                    const isTestOverdue = diffMs <= 0;
                    const daysLeft = isTestOverdue ? 0 : Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                    const isTestDueSoon = !isTestOverdue && daysLeft <= 7;

                    if (isTestOverdue || isTestDueSoon) {
                        const formattedDate = targetDate.toLocaleDateString('en-US', {
                            timeZone: 'Asia/Manila',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        });
                        const formattedTime = targetDate.toLocaleTimeString('en-US', {
                            timeZone: 'Asia/Manila',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        });

                        waterTestAlert = {
                            id: 'water-test-schedule',
                            testType: waterTestSchedule.test_type || 'Monthly Water Quality Test',
                            notes: waterTestSchedule.notes || '',
                            formattedDate: `${formattedDate} • ${formattedTime}`,
                            isOverdue: isTestOverdue,
                            isDueSoon: isTestDueSoon,
                            daysLeft,
                            statusLabel: isTestOverdue
                                ? 'OVERDUE'
                                : daysLeft <= 1
                                    ? 'DUE TODAY'
                                    : `${daysLeft}d left`
                        };
                    }
                }
            }

            return {
                dueVehicles,
                dueFilters,
                goodFilters,
                notDueFilters,
                overdueVehicles,
                overdueFilters,
                dueSoonFilters,
                dueSoonVehicles,
                allVehicles: processedVehicles,
                allFilters: processedFilters,
                waterTestAlert,
                hasDueAlerts: dueVehicles.length > 0 || dueFilters.length > 0,
                hasOverdue: overdueVehicles.length > 0 || overdueFilters.length > 0 || Boolean(waterTestAlert?.isOverdue)
            };
        },
        enabled: !!user && !isDemo,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true
    });
}

export const useDueMaintenance = useMaintenanceAlerts;

export function useOverdueVehicles() {
    const user = useStore(s => s.user);
    const isDemo = user?.isDemo;

    return useQuery({
        queryKey: ['overdue-vehicles', user?.id, isDemo],
        queryFn: async () => {
            if (!user || isDemo) return [];

            const [vehiclesRes, historyRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
                supabase.from('maintenance_history').select('*').order('replaced_at', { ascending: false })
            ]);

            if (vehiclesRes.error) throw vehiclesRes.error;
            if (historyRes.error) throw historyRes.error;

            const dbVehicles = vehiclesRes.data || [];
            const history = historyRes.data || [];

            const latestDates = {};
            history.forEach(record => {
                if (!latestDates[record.item_id]) {
                    latestDates[record.item_id] = record.replaced_at;
                }
            });

            const now = new Date();
            const processedVehicles = dbVehicles.map(vehicle => {
                const lastReplaced = latestDates[vehicle.id] ? new Date(latestDates[vehicle.id]) : new Date(vehicle.created_at || now);
                const totalLifespanDays = Number(
                    vehicle.lifespan_days || (vehicle.lifespan_months ? vehicle.lifespan_months * 30 : 180)
                );
                const dueDate = addMonths(lastReplaced, vehicle.lifespan_months || 6);
                const daysPassed = Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
                const timePercent = Math.min(100, (daysPassed / totalLifespanDays) * 100);

                return {
                    ...vehicle,
                    dueDate,
                    daysPassed,
                    daysLeft,
                    timePercent,
                    isOverdue: daysLeft === 0,
                    totalLifespanDays
                };
            });

            return processedVehicles.filter(v => v.isOverdue);
        },
        enabled: !!user && !isDemo,
        staleTime: 1000 * 60 * 2,
        refetchOnWindowFocus: true
    });
}