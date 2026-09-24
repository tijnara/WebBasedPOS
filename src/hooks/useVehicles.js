// src/hooks/useVehicles.js
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import { addMonths, addDays, isSameDay } from 'date-fns';
import { useStore } from '../store/useStore';
import { logActivity } from './useActivityLogs';
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
                    allVehicles: [],
                    allFilters: [],
                    hasDueAlerts: false,
                    hasOverdue: false
                };
            }

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

            // 1. Process Vehicles
            const processedVehicles = dbVehicles.map(vehicle => {
                const lastReplaced = latestDates[vehicle.id]
                    ? new Date(latestDates[vehicle.id])
                    : new Date(vehicle.created_at || now);
                const dueDate = addMonths(lastReplaced, vehicle.lifespan_months || 6);
                const daysPassed = Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24));
                const totalLifespanDays = Math.floor((dueDate - lastReplaced) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
                const isOverdue = daysLeft === 0;
                const isDueWithin24h = isOverdue && isWithin24HoursOfDate(now, dueDate);

                return {
                    ...vehicle,
                    lastReplaced,
                    dueDate,
                    daysPassed,
                    daysLeft,
                    totalLifespanDays,
                    isOverdue,
                    isDueWithin24h
                };
            });

            const overdueVehicles = processedVehicles.filter(v => v.isOverdue);
            const dueVehicles = processedVehicles.filter(v => v.isDueWithin24h);

            // 2. Process Filters
            const filterPromises = FILTER_CONFIG.map(async (filter) => {
                const lastReplaced = latestDates[filter.id] ? new Date(latestDates[filter.id]) : new Date();
                const timeDueDate = addDays(lastReplaced, filter.lifespanDays);
                const daysPassed = Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
                const isTimeOverdue = daysLeft === 0;
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
                const isDueWithin24h = isTimeDueWithin24h || isUsageDueWithin24h;
                const containersLeft = Math.max(0, filter.containerLimit - containersSold);

                let reason = '';
                if (isTimeDueWithin24h && isUsageDueWithin24h) {
                    reason = `Time & usage limit reached (${containersSold}/${filter.containersText} containers)`;
                } else if (isUsageDueWithin24h) {
                    reason = `Limit reached (${containersSold}/${filter.containersText} containers)`;
                } else if (isTimeDueWithin24h) {
                    reason = `Lifespan reached (${filter.lifespanDays} days)`;
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
                    isTimeDueWithin24h,
                    isUsageDueWithin24h,
                    isDueWithin24h,
                    reason
                };
            });

            const processedFilters = await Promise.all(filterPromises);
            const overdueFilters = processedFilters.filter(f => f.isOverdue);
            const dueFilters = processedFilters.filter(f => f.isDueWithin24h);
            const goodFilters = processedFilters.filter(f => !f.isDueWithin24h && !f.isOverdue);
            const notDueFilters = processedFilters.filter(f => !f.isDueWithin24h);

            return {
                dueVehicles,
                dueFilters,
                goodFilters,
                notDueFilters,
                overdueVehicles,
                overdueFilters,
                allVehicles: processedVehicles,
                allFilters: processedFilters,
                hasDueAlerts: dueVehicles.length > 0 || dueFilters.length > 0,
                hasOverdue: overdueVehicles.length > 0 || overdueFilters.length > 0
            };
        },
        enabled: !!user && !isDemo,
        staleTime: 1000 * 60 * 5,
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
                const lastReplaced = latestDates[vehicle.id] ? new Date(latestDates[vehicle.id]) : new Date();
                const dueDate = addMonths(lastReplaced, vehicle.lifespan_months || 6);
                const daysPassed = Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24));
                const totalLifespanDays = Math.floor((dueDate - lastReplaced) / (1000 * 60 * 60 * 24));
                const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
                const timePercent = Math.min(100, (daysPassed / totalLifespanDays) * 100);

                return {
                    ...vehicle,
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
        staleTime: 1000 * 60 * 5,
        refetchOnWindowFocus: true
    });
}