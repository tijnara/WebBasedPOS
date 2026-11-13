// src/components/tracking/MaintenanceTrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { useCreateExpense } from '../../hooks/useExpenses';
import { logActivity } from '../../hooks/useActivityLogs';
import { startOfWeek, addWeeks, addDays, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
    Button, Input, Label, Textarea, Select, Table, TableHeader, TableRow, TableHead,
    TableBody, TableCell
} from '../ui';
import { Edit2, Trash2, Sliders, Droplets, Truck, AlertTriangle, FlaskConical, Plus, Check } from 'lucide-react';

import PendingPurchases from '../tracking/PendingPurchases';
import FilterList from '../tracking/FilterList';
import VehicleList from '../tracking/VehicleList';
import WaterTestScheduleCard from '../tracking/WaterTestScheduleCard';
import { FILTER_CONFIG } from '../../config/constants';

const DEFAULT_WATER_TEST_TYPES = [
    { id: 'default-1', name: 'Monthly Bacteriological & Physico-Chemical Test', default_interval_days: 30 },
    { id: 'default-2', name: 'Monthly Bacteriological Water Test (HPC & Coliform)', default_interval_days: 30 },
    { id: 'default-3', name: 'Semi-Annual Physico-Chemical Water Analysis', default_interval_days: 180 },
    { id: 'default-4', name: 'Weekly TDS, pH & Residual Chlorine Check', default_interval_days: 7 }
];

const DEFAULT_WATER_TEST_SCHEDULE = {
    id: 1,
    next_test_date: format(addDays(new Date(), 15), 'yyyy-MM-dd'),
    test_time: '09:00',
    interval_days: 30,
    test_type: 'Monthly Bacteriological & Physico-Chemical Test',
    notes: 'Water quality parameters are normal. Prepare sterile sample bottles prior to scheduled lab testing.',
    last_tested_at: null
};

export default function MaintenanceTrackingPage() {
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;
    const queryClient = useQueryClient();

    const isAdmin = Boolean(
        user && (
            user.isadmin === true ||
            user.isAdmin === true ||
            user.isSuperAdmin === true ||
            String(user.role?.name || user.role || '').toLowerCase().includes('admin')
        )
    );

    // Segmented Active Tab: 'filters' or 'fleet'
    const [activeTab, setActiveTab] = useState('filters');

    const [filterConfigs, setFilterConfigs] = useState(FILTER_CONFIG);
    const [trackingData, setTrackingData] = useState({});
    const [usageData, setUsageData] = useState({});
    const [dbVehicles, setDbVehicles] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // Water Test Schedule & Saved Test Types State
    const [waterTestSchedule, setWaterTestSchedule] = useState(DEFAULT_WATER_TEST_SCHEDULE);
    const [waterTestTypes, setWaterTestTypes] = useState(DEFAULT_WATER_TEST_TYPES);
    const [isSavingWaterTest, setIsSavingWaterTest] = useState(false);
    const [isAddingTestType, setIsAddingTestType] = useState(false);
    const [newTestTypeName, setNewTestTypeName] = useState('');
    const [newTestTypeInterval, setNewTestTypeInterval] = useState(30);
    const [isSavingTestType, setIsSavingTestType] = useState(false);

    const [waterTestModal, setWaterTestModal] = useState({
        isOpen: false,
        nextTestDate: DEFAULT_WATER_TEST_SCHEDULE.next_test_date,
        testTime: '09:00',
        intervalDays: 30,
        testType: DEFAULT_WATER_TEST_SCHEDULE.test_type,
        notes: DEFAULT_WATER_TEST_SCHEDULE.notes
    });

    // Modals
    const [recordModal, setRecordModal] = useState({
        isOpen: false,
        itemId: null,
        itemType: null,
        itemName: '',
        customDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
    });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [manageVehiclesModal, setManageVehiclesModal] = useState(false);

    // Filter Edit Modal State
    const [editFilterModal, setEditFilterModal] = useState({
        isOpen: false,
        filterId: '',
        filterName: '',
        lifespanDays: 28,
        containerLimit: 1000,
        cost: 0
    });

    // Vehicle Form State
    const [vehicleForm, setVehicleForm] = useState({
        id: null,
        name: '',
        lifespanDays: 180,
        lifespanMonths: 6,
        purpose: '',
        lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd')
    });

    const createExpense = useCreateExpense();

    const invalidateMaintenanceCaches = () => {
        queryClient.invalidateQueries({ queryKey: ['dashboard-live-maintenance-lifespans'] });
        queryClient.invalidateQueries({ queryKey: ['overdue-vehicles'] });
        queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    };

    const fetchTrackingData = async () => {
        setIsLoading(true);
        if (isDemo) {
            setIsLoading(false);
            return;
        }

        try {
            // 1. Fetch DB overrides for filter limits
            let activeFilters = FILTER_CONFIG;
            try {
                const { data: dbConfigs, error: configError } = await supabase
                    .from('filter_configs')
                    .select('*');

                if (!configError && dbConfigs && dbConfigs.length > 0) {
                    activeFilters = FILTER_CONFIG.map(defaultFilter => {
                        const matched = dbConfigs.find(c => c.id === defaultFilter.id);
                        if (!matched) return defaultFilter;
                        return {
                            ...defaultFilter,
                            lifespanDays: matched.lifespan_days ?? defaultFilter.lifespanDays,
                            lifespanWeeks: Math.max(1, Math.ceil((matched.lifespan_days ?? defaultFilter.lifespanDays) / 7)),
                            containerLimit: matched.container_limit ?? defaultFilter.containerLimit,
                            containersText: Number(matched.container_limit ?? defaultFilter.containerLimit).toLocaleString(),
                            cost: matched.cost ? Number(matched.cost) : defaultFilter.cost
                        };
                    });
                }
            } catch (err) {
                console.warn('Using default filter config:', err.message);
            }
            setFilterConfigs(activeFilters);

            // 2. Fetch Vehicles, Maintenance History, Water Test Schedule, and Water Test Types
            const [vehiclesRes, historyRes, waterTestRes, testTypesRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
                supabase.from('maintenance_history').select('*').order('replaced_at', { ascending: false }),
                supabase.from('water_test_schedules').select('*').eq('id', 1).maybeSingle(),
                supabase.from('water_test_types').select('*').order('created_at', { ascending: true })
            ]);

            if (vehiclesRes.error) throw vehiclesRes.error;
            if (historyRes.error) throw historyRes.error;

            if (!waterTestRes.error && waterTestRes.data) {
                setWaterTestSchedule(waterTestRes.data);
            } else if (typeof window !== 'undefined') {
                const cached = localStorage.getItem('seaside_water_test_schedule');
                if (cached) {
                    try {
                        setWaterTestSchedule(JSON.parse(cached));
                    } catch {
                        // Ignore parse errors
                    }
                }
            }

            if (!testTypesRes.error && Array.isArray(testTypesRes.data) && testTypesRes.data.length > 0) {
                setWaterTestTypes(testTypesRes.data);
            } else if (typeof window !== 'undefined') {
                const cachedTypes = localStorage.getItem('seaside_water_test_types');
                if (cachedTypes) {
                    try {
                        const parsed = JSON.parse(cachedTypes);
                        if (Array.isArray(parsed) && parsed.length > 0) setWaterTestTypes(parsed);
                    } catch {
                        // Ignore parse errors
                    }
                }
            }

            const vehiclesList = vehiclesRes.data || [];
            setDbVehicles(vehiclesList);
            setFullHistory(historyRes.data || []);

            const latestDates = {};
            (historyRes.data || []).forEach(record => {
                if (!latestDates[record.item_id]) {
                    latestDates[record.item_id] = record.replaced_at;
                }
            });
            setTrackingData(latestDates);

            // 3. Compute Filter Usages (Sold since last replacement for volume monitoring)
            const mappedUsage = {};
            for (const filter of activeFilters) {
                if (latestDates[filter.id]) {
                    const { data: salesData, error: salesError } = await supabase
                        .from('sale_items')
                        .select('quantity, sales!inner(saletimestamp, status)')
                        .in('product_id', [2, 3, 30])
                        .eq('sales.status', 'Completed')
                        .gte('sales.saletimestamp', latestDates[filter.id]);

                    if (salesError) throw salesError;
                    mappedUsage[filter.id] = salesData ? salesData.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
                } else {
                    mappedUsage[filter.id] = 0;
                }
            }
            setUsageData(mappedUsage);

            checkNotifications(latestDates, activeFilters);
        } catch (error) {
            console.error("Error fetching data:", error);
            addToast({ title: 'Error', description: 'Failed to load tracking data.', variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTrackingData();
    }, []);

    const checkNotifications = (dates, filters) => {
        let overdueItems = [];

        filters.forEach(filter => {
            const lastReplaced = dates[filter.id] ? new Date(dates[filter.id]) : new Date();
            const daysPassed = Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24));
            if (daysPassed >= filter.lifespanDays) {
                overdueItems.push(filter.name);
            }
        });

        if (overdueItems.length > 0) {
            addToast({
                title: 'Filter Replacement Required!',
                description: `Filters overdue by time: ${overdueItems.join(', ')}`,
                variant: 'destructive'
            });
        }
    };

    // Calculate processed values: Time is the replacement driver; Gallons are for volume monitoring
    const processedFilters = filterConfigs.map(filter => {
        const lastReplaced = trackingData[filter.id] ? new Date(trackingData[filter.id]) : new Date();
        const daysPassed = Math.max(0, Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24)));
        const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
        const timePercent = Math.min(100, Math.max(0, (daysPassed / filter.lifespanDays) * 100));
        const isTimeOverdue = daysPassed >= filter.lifespanDays;

        const containersSold = usageData[filter.id] || 0;
        const containerLimit = Number(filter.containerLimit || 1500);
        const containersLeft = Math.max(0, containerLimit - containersSold);
        const usagePercent = Math.min(100, Math.max(0, (containersSold / containerLimit) * 100));

        return {
            ...filter,
            daysPassed,
            daysLeft,
            timePercent,
            isTimeOverdue,
            containersSold,
            containerLimit,
            containersLeft,
            usagePercent,
            isOverdue: isTimeOverdue
        };
    });

    // Calculate processed values for vehicles strictly by time/days
    const processedVehicles = dbVehicles.map(vehicle => {
        const lastReplaced = trackingData[vehicle.id] ? new Date(trackingData[vehicle.id]) : new Date(vehicle.created_at || new Date());
        const now = new Date();

        const totalLifespanDays = vehicle.lifespan_days || (vehicle.lifespan_months ? vehicle.lifespan_months * 30 : 180);
        const daysPassed = Math.max(0, Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24)));
        const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
        const timePercent = Math.min(100, Math.max(0, (daysPassed / totalLifespanDays) * 100));
        const isTimeOverdue = daysPassed >= totalLifespanDays;

        return {
            ...vehicle,
            daysPassed,
            daysLeft,
            totalLifespanDays,
            timePercent,
            isTimeOverdue,
            isOverdue: isTimeOverdue
        };
    });

    const overdueFilters = processedFilters.filter(f => f.isOverdue);
    const totalOverdueCost = overdueFilters.reduce((sum, f) => sum + (Number(f.cost || 0) * Number(f.pcs || 1)), 0);
    const overdueVehicles = processedVehicles.filter(v => v.isOverdue);

    // --- Water Test Types & Schedule Handlers ---
    const handleOpenWaterTestModal = () => {
        if (!isAdmin) return;
        setIsAddingTestType(false);
        setNewTestTypeName('');
        setNewTestTypeInterval(30);
        setWaterTestModal({
            isOpen: true,
            nextTestDate: waterTestSchedule?.next_test_date || format(addDays(new Date(), 15), 'yyyy-MM-dd'),
            testTime: waterTestSchedule?.test_time || '09:00',
            intervalDays: Number(waterTestSchedule?.interval_days || 30),
            testType: waterTestSchedule?.test_type || waterTestTypes[0]?.name || 'Monthly Bacteriological & Physico-Chemical Test',
            notes: waterTestSchedule?.notes || ''
        });
    };

    const handleSelectTestType = (selectedName) => {
        const matched = waterTestTypes.find(t => t.name === selectedName);
        setWaterTestModal(prev => ({
            ...prev,
            testType: selectedName,
            intervalDays: matched?.default_interval_days ? Number(matched.default_interval_days) : prev.intervalDays
        }));
    };

    const handleAddNewTestType = async () => {
        if (!isAdmin || isDemo) return;
        const cleanName = newTestTypeName.trim();
        if (!cleanName) {
            addToast({ title: 'Name Required', description: 'Please enter a water test type name.', variant: 'destructive' });
            return;
        }

        const existing = waterTestTypes.find(t => t.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
            setWaterTestModal(prev => ({
                ...prev,
                testType: existing.name,
                intervalDays: Number(existing.default_interval_days || prev.intervalDays)
            }));
            setIsAddingTestType(false);
            setNewTestTypeName('');
            addToast({ title: 'Selected Existing Type', description: `"${existing.name}" is already in the list.`, variant: 'success' });
            return;
        }

        setIsSavingTestType(true);
        try {
            const defaultInterval = Math.max(1, parseInt(newTestTypeInterval, 10) || 30);
            const { data, error } = await supabase
                .from('water_test_types')
                .insert([{
                    name: cleanName,
                    default_interval_days: defaultInterval,
                    created_by: user?.id || null
                }])
                .select()
                .single();

            let createdItem = data;
            if (error) {
                if (error.code === '42P01' || error.code === 'PGRST205') {
                    createdItem = {
                        id: `local-${Date.now()}`,
                        name: cleanName,
                        default_interval_days: defaultInterval
                    };
                    addToast({
                        title: 'Added Locally (Run SQL Migration)',
                        description: 'Run the water_test_types SQL in Supabase to persist across all devices.',
                        variant: 'warning'
                    });
                } else {
                    throw error;
                }
            } else {
                await logActivity({
                    user,
                    action: 'CREATE',
                    entity_type: 'MAINTENANCE',
                    description: `Added new water test type: "${cleanName}" (${defaultInterval}-day cycle)`
                });
                queryClient.invalidateQueries({ queryKey: ['activity-logs'] });

                addToast({
                    title: 'Test Type Saved',
                    description: `"${cleanName}" saved to database and selected.`,
                    variant: 'success'
                });
            }

            const updatedList = [...waterTestTypes, createdItem];
            setWaterTestTypes(updatedList);
            if (typeof window !== 'undefined') {
                localStorage.setItem('seaside_water_test_types', JSON.stringify(updatedList));
            }

            setWaterTestModal(prev => ({
                ...prev,
                testType: createdItem.name,
                intervalDays: defaultInterval
            }));
            setNewTestTypeName('');
            setIsAddingTestType(false);
        } catch (err) {
            console.error('Error saving water test type:', err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingTestType(false);
        }
    };

    const handleDeleteTestType = async (typeObj) => {
        if (!isAdmin || isDemo || !typeObj) return;
        if (!window.confirm(`Remove "${typeObj.name}" from saved water test types?`)) return;

        try {
            if (typeof typeObj.id === 'number') {
                const { error } = await supabase
                    .from('water_test_types')
                    .delete()
                    .eq('id', typeObj.id);
                if (error) throw error;
            }

            await logActivity({
                user,
                action: 'DELETE',
                entity_type: 'MAINTENANCE',
                description: `Removed water test type: "${typeObj.name}"`
            });
            queryClient.invalidateQueries({ queryKey: ['activity-logs'] });

            const updatedList = waterTestTypes.filter(t => t.name !== typeObj.name);
            const fallbackList = updatedList.length > 0 ? updatedList : DEFAULT_WATER_TEST_TYPES;
            setWaterTestTypes(fallbackList);

            if (typeof window !== 'undefined') {
                localStorage.setItem('seaside_water_test_types', JSON.stringify(fallbackList));
            }

            if (waterTestModal.testType === typeObj.name) {
                setWaterTestModal(prev => ({
                    ...prev,
                    testType: fallbackList[0].name,
                    intervalDays: Number(fallbackList[0].default_interval_days || 30)
                }));
            }

            addToast({ title: 'Removed', description: `"${typeObj.name}" removed.`, variant: 'success' });
        } catch (err) {
            console.error('Error deleting water test type:', err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleSaveWaterTestSchedule = async (e) => {
        e.preventDefault();
        if (!isAdmin || isDemo) return;
        setIsSavingWaterTest(true);

        try {
            const payload = {
                id: 1,
                next_test_date: waterTestModal.nextTestDate,
                test_time: waterTestModal.testTime || '09:00',
                interval_days: Math.max(1, parseInt(waterTestModal.intervalDays, 10) || 30),
                test_type: waterTestModal.testType.trim() || 'Monthly Water Quality Test',
                notes: waterTestModal.notes.trim(),
                last_tested_at: waterTestSchedule?.last_tested_at || null,
                updated_by: user?.id || null,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('water_test_schedules')
                .upsert(payload, { onConflict: 'id' })
                .select()
                .single();

            if (error) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem('seaside_water_test_schedule', JSON.stringify(payload));
                }
                setWaterTestSchedule(payload);
                if (error.code === '42P01' || error.code === 'PGRST205') {
                    addToast({
                        title: 'Saved Locally (Run SQL Migration)',
                        description: 'Schedule saved in browser. Run the water_test_schedules SQL in Supabase to sync across all devices.',
                        variant: 'warning'
                    });
                } else {
                    throw error;
                }
            } else {
                setWaterTestSchedule(data);
                if (typeof window !== 'undefined') {
                    localStorage.setItem('seaside_water_test_schedule', JSON.stringify(data));
                }

                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'MAINTENANCE',
                    description: `Updated Water Test Schedule: "${payload.test_type}" set for ${payload.next_test_date} at ${payload.test_time}`
                });
                invalidateMaintenanceCaches();

                addToast({
                    title: 'Water Test Scheduled',
                    description: `Countdown updated for ${format(new Date(`${payload.next_test_date}T00:00:00+08:00`), 'MMM d, yyyy')}.`,
                    variant: 'success'
                });
            }

            setWaterTestModal(prev => ({ ...prev, isOpen: false }));
        } catch (err) {
            console.error('Water test schedule save error:', err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingWaterTest(false);
        }
    };

    const handleRecordWaterTestComplete = async () => {
        if (isDemo) return;
        setIsSavingWaterTest(true);

        try {
            const nowIso = new Date().toISOString();
            const intervalDays = Math.max(1, Number(waterTestSchedule?.interval_days || 30));

            const manilaTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
            const nextDateObj = addDays(new Date(`${manilaTodayStr}T12:00:00+08:00`), intervalDays);
            const nextDateStr = format(nextDateObj, 'yyyy-MM-dd');

            const { error: histErr } = await supabase.from('maintenance_history').insert({
                item_id: 'water_test',
                item_type: 'water_test',
                replaced_at: nowIso,
                replaced_by: user?.id || null
            });
            if (histErr) throw histErr;

            const updatedSchedule = {
                id: 1,
                next_test_date: nextDateStr,
                test_time: waterTestSchedule?.test_time || '09:00',
                interval_days: intervalDays,
                test_type: waterTestSchedule?.test_type || 'Monthly Bacteriological & Physico-Chemical Test',
                notes: waterTestSchedule?.notes || 'Water quality parameters are normal. No immediate lab testing action required until scheduled date.',
                last_tested_at: nowIso,
                updated_by: user?.id || null,
                updated_at: nowIso
            };

            const { data, error: schedErr } = await supabase
                .from('water_test_schedules')
                .upsert(updatedSchedule, { onConflict: 'id' })
                .select()
                .single();

            const finalSched = !schedErr && data ? data : updatedSchedule;
            setWaterTestSchedule(finalSched);
            if (typeof window !== 'undefined') {
                localStorage.setItem('seaside_water_test_schedule', JSON.stringify(finalSched));
            }

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'MAINTENANCE',
                description: `Completed water quality test (${updatedSchedule.test_type}) — next test scheduled for ${nextDateStr}`
            });
            invalidateMaintenanceCaches();

            addToast({
                title: 'Water Test Logged',
                description: `Test recorded! Next water test scheduled for ${format(nextDateObj, 'MMM d, yyyy')}.`,
                variant: 'success'
            });

            await fetchTrackingData();
        } catch (err) {
            console.error('Error recording water test:', err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsSavingWaterTest(false);
        }
    };

    // Filter limits edit
    const handleOpenEditFilter = (filter) => {
        if (!isAdmin) return;
        setEditFilterModal({
            isOpen: true,
            filterId: filter.id,
            filterName: filter.name,
            lifespanDays: filter.lifespanDays,
            containerLimit: filter.containerLimit || 1000,
            cost: filter.cost
        });
    };

    const handleSaveFilterLimits = async (e) => {
        e.preventDefault();
        if (!isAdmin || isDemo) return;

        try {
            const lifespanDays = parseInt(editFilterModal.lifespanDays, 10) || 28;
            const containerLimit = parseInt(editFilterModal.containerLimit, 10) || 1000;
            const cost = parseFloat(editFilterModal.cost) || 0;

            const { error } = await supabase
                .from('filter_configs')
                .upsert({
                    id: editFilterModal.filterId,
                    name: editFilterModal.filterName,
                    lifespan_days: lifespanDays,
                    container_limit: containerLimit,
                    cost: cost,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'MAINTENANCE',
                description: `Admin updated limits for "${editFilterModal.filterName}": ${lifespanDays} days, ${containerLimit.toLocaleString()} containers`
            });

            addToast({ title: 'Limits Updated', description: 'Filter lifespan and container target updated.', variant: 'success' });
            setEditFilterModal(prev => ({ ...prev, isOpen: false }));
            invalidateMaintenanceCaches();
            await fetchTrackingData();
        } catch (err) {
            console.error('Filter limits save error:', err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const handleOpenRecordModal = (id, name, type) => {
        setRecordModal({
            isOpen: true,
            itemId: id,
            itemName: name,
            itemType: type,
            customDate: format(new Date(), "yyyy-MM-dd'T'HH:mm")
        });
    };

    const handleConfirmRecord = async (e) => {
        e.preventDefault();
        if (isDemo) return;

        const { error } = await supabase.from('maintenance_history').insert({
            item_id: recordModal.itemId,
            item_type: recordModal.itemType,
            replaced_at: new Date(recordModal.customDate).toISOString(),
            replaced_by: user?.id
        });

        if (!error) {
            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'MAINTENANCE',
                description: `Recorded ${recordModal.itemType === 'vehicle' ? 'vehicle maintenance' : 'filter replacement'} for "${recordModal.itemName}"`
            });

            addToast({ title: 'Success', description: 'Maintenance record saved.', variant: 'success' });
            setRecordModal({ isOpen: false, itemId: null, itemType: null, itemName: '', customDate: '' });
            invalidateMaintenanceCaches();
            fetchTrackingData();
        } else {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handlePurchaseAndRecord = async () => {
        if (isDemo) return;
        setIsPurchasing(true);
        try {
            const today = new Date();
            const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 });
            const expensePromises = [];

            overdueFilters.forEach(filter => {
                const weeklyCost = (Number(filter.cost || 0) * Number(filter.pcs || 1)) / (filter.lifespanWeeks || 1);
                for (let i = 0; i < (filter.lifespanWeeks || 1); i++) {
                    expensePromises.push(
                        createExpense.mutateAsync({
                            amount: weeklyCost.toFixed(2),
                            category: 'Maintenance',
                            description: `Filter Replacement (${filter.name}) - Week ${i + 1}/${filter.lifespanWeeks || 1}`,
                            expense_date: addWeeks(startOfCurrentWeek, i).toISOString()
                        })
                    );
                }
            });
            await Promise.all(expensePromises);

            const historyPromises = overdueFilters.map(f => supabase.from('maintenance_history').insert({
                item_id: f.id,
                item_type: 'filter',
                replaced_at: new Date().toISOString(),
                replaced_by: user?.id
            }));
            const results = await Promise.all(historyPromises);

            for (const res of results) {
                if (res.error) throw res.error;
            }

            await logActivity({
                user,
                action: 'CREATE',
                entity_type: 'MAINTENANCE',
                description: `Purchased & replaced ${overdueFilters.length} overdue filter(s) (Total: ₱${Number(totalOverdueCost).toFixed(2)})`
            });

            addToast({ title: 'Purchase Recorded', description: 'Expenses amortized and counters reset.', variant: 'success' });
            invalidateMaintenanceCaches();
            fetchTrackingData();
        } catch (error) {
            addToast({ title: 'Error', description: error.message || 'Failed to record expenses.', variant: 'destructive' });
        } finally {
            setIsPurchasing(false);
        }
    };

    // Vehicle CRUD Logic
    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        if (isDemo) return;

        try {
            let vehicleId = vehicleForm.id;
            const lifespanDays = parseInt(vehicleForm.lifespanDays, 10) || Math.max(1, (vehicleForm.lifespanMonths || 6) * 30);
            const lifespanMonths = Math.max(1, Math.round(lifespanDays / 30));

            if (vehicleId) {
                const { error } = await supabase.from('vehicles').update({
                    name: vehicleForm.name,
                    lifespan_days: lifespanDays,
                    lifespan_months: lifespanMonths,
                    purpose: vehicleForm.purpose
                }).eq('id', vehicleId);

                if (error) throw error;
                await logActivity({
                    user,
                    action: 'UPDATE',
                    entity_type: 'MAINTENANCE',
                    description: `Updated vehicle "${vehicleForm.name}" (${lifespanDays}-day maintenance interval)`
                });
                addToast({ title: 'Updated', description: 'Vehicle updated successfully.', variant: 'success' });
            } else {
                const { data, error } = await supabase.from('vehicles').insert({
                    name: vehicleForm.name,
                    lifespan_days: lifespanDays,
                    lifespan_months: lifespanMonths,
                    purpose: vehicleForm.purpose
                }).select().single();

                if (error) throw error;
                vehicleId = data.id;
                await logActivity({
                    user,
                    action: 'CREATE',
                    entity_type: 'MAINTENANCE',
                    description: `Added new vehicle "${vehicleForm.name}" (${lifespanDays}-day maintenance interval)`
                });
                addToast({ title: 'Added', description: 'New vehicle added.', variant: 'success' });
            }

            const currentTrackedDate = trackingData[vehicleId] ? format(new Date(trackingData[vehicleId]), 'yyyy-MM-dd') : null;

            if (!currentTrackedDate || currentTrackedDate !== vehicleForm.lastMaintenanceDate) {
                const dateObj = new Date(`${vehicleForm.lastMaintenanceDate}T12:00:00+08:00`);
                const { error: historyError } = await supabase.from('maintenance_history').insert({
                    item_id: vehicleId,
                    item_type: 'vehicle',
                    replaced_at: dateObj.toISOString(),
                    replaced_by: user?.id || null
                });
                if (historyError) throw historyError;
            }

            setVehicleForm({
                id: null,
                name: '',
                lifespanDays: 180,
                lifespanMonths: 6,
                purpose: '',
                lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd')
            });
            invalidateMaintenanceCaches();
            await fetchTrackingData();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (isDemo) return addToast({ title: 'Demo Mode', description: 'Deleting vehicles is disabled in demo mode.', variant: 'warning' });
        if (!window.confirm("Delete this vehicle? Its history will remain but detached.")) return;

        const targetVehicle = dbVehicles.find(v => v.id === id);
        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            await logActivity({
                user,
                action: 'DELETE',
                entity_type: 'MAINTENANCE',
                description: `Deleted vehicle "${targetVehicle?.name || `ID #${id}`}"`
            });
            addToast({ title: 'Deleted', description: 'Vehicle removed.', variant: 'success' });
            invalidateMaintenanceCaches();
            fetchTrackingData();
        }
    };

    const handleEditVehicleClick = (v) => {
        const lastDate = trackingData[v.id]
            ? format(new Date(trackingData[v.id]), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd');

        const days = v.lifespan_days || (v.lifespan_months ? v.lifespan_months * 30 : 180);

        setVehicleForm({
            id: v.id,
            name: v.name,
            lifespanDays: days,
            lifespanMonths: v.lifespan_months || Math.round(days / 30),
            purpose: v.purpose || '',
            lastMaintenanceDate: lastDate
        });
        setManageVehiclesModal(true);
    };

    const dropdownTestTypes = React.useMemo(() => {
        const list = [...waterTestTypes];
        if (
            waterTestModal.testType &&
            !list.some(t => t.name.toLowerCase() === waterTestModal.testType.toLowerCase())
        ) {
            list.unshift({
                id: 'current-active',
                name: waterTestModal.testType,
                default_interval_days: waterTestModal.intervalDays || 30
            });
        }
        return list;
    }, [waterTestTypes, waterTestModal.testType, waterTestModal.intervalDays]);

    const selectedTypeObj = waterTestTypes.find(t => t.name === waterTestModal.testType);

    return (
        <div className="p-3 sm:p-5 md:p-6 max-w-7xl mx-auto space-y-4">
            {/* Top Bar: Title & Admin Settings Triggers */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                    <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                        Filter &amp; Maintenance Tracking
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                        Monitor water filtration lifespans, laboratory water test schedules, and delivery vehicle servicing.
                    </p>
                </div>
                {isAdmin && (
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <Button
                            variant="outline"
                            onClick={handleOpenWaterTestModal}
                            className="h-9 px-3.5 text-xs font-bold border-cyan-200 dark:border-cyan-800 bg-cyan-50/70 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 rounded-xl shadow-2xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                            <FlaskConical className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Water Test Schedule</span>
                        </Button>

                        <Button
                            variant="primary"
                            onClick={() => setManageVehiclesModal(true)}
                            className="h-9 px-3.5 text-xs font-bold bg-[#8DB600] hover:bg-[#7ca000] text-white rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                        >
                            <Sliders className="w-3.5 h-3.5" />
                            <span>Manage Vehicles</span>
                        </Button>
                    </div>
                )}
            </div>

            {/* Segmented Control Tabs */}
            <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-max border border-slate-200/80 dark:border-slate-700/60 select-none">
                <button
                    type="button"
                    onClick={() => setActiveTab('filters')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                        activeTab === 'filters'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>Water Filters</span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                        {processedFilters.length}
                    </span>
                    {overdueFilters.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> {overdueFilters.length}
                        </span>
                    )}
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('fleet')}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 cursor-pointer ${
                        activeTab === 'fleet'
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Fleet &amp; Logistics</span>
                    <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-full font-bold">
                        {processedVehicles.length}
                    </span>
                    {overdueVehicles.length > 0 && (
                        <span className="flex items-center gap-0.5 text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full animate-pulse">
                            <AlertTriangle className="w-2.5 h-2.5" /> {overdueVehicles.length}
                        </span>
                    )}
                </button>
            </div>

            {isLoading ? (
                <div className="text-center py-16 text-slate-400 text-xs font-semibold">
                    Loading maintenance records...
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Tab 1: Water Filtration */}
                    {activeTab === 'filters' && (
                        <div className="flex flex-col lg:flex-row gap-5 items-start">
                            {/* Right Sidebar: Filter Status Note + Live Water Test Schedule Countdown */}
                            <div className="w-full lg:w-80 shrink-0 order-first lg:order-last space-y-4">
                                <PendingPurchases
                                    overdueFilters={overdueFilters}
                                    totalOverdueCost={totalOverdueCost}
                                    handlePurchaseAndRecord={handlePurchaseAndRecord}
                                    isPurchasing={isPurchasing}
                                    isDemo={isDemo}
                                />

                                <WaterTestScheduleCard
                                    schedule={waterTestSchedule}
                                    isAdmin={isAdmin}
                                    isSaving={isSavingWaterTest}
                                    onOpenScheduleModal={handleOpenWaterTestModal}
                                    onRecordTestComplete={handleRecordWaterTestComplete}
                                    onViewHistory={() =>
                                        setHistoryModal({
                                            isOpen: true,
                                            itemId: 'water_test',
                                            itemName: waterTestSchedule?.test_type || 'Water Quality Test'
                                        })
                                    }
                                />
                            </div>

                            {/* Filter Cards List */}
                            <div className="flex-1 w-full order-last lg:order-first">
                                <FilterList
                                    processedFilters={processedFilters}
                                    handleReplace={(id) => handleOpenRecordModal(id, filterConfigs.find(f => f.id === id)?.name, 'filter')}
                                    handleViewHistory={(id) => setHistoryModal({ isOpen: true, itemId: id, itemName: filterConfigs.find(f => f.id === id)?.name })}
                                    handleEditFilter={handleOpenEditFilter}
                                    isAdmin={isAdmin}
                                    isPurchasing={isPurchasing}
                                />
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Delivery Fleet */}
                    {activeTab === 'fleet' && (
                        <div className="w-full">
                            <VehicleList
                                processedVehicles={processedVehicles}
                                handleReplace={(id) => handleOpenRecordModal(id, dbVehicles.find(v => v.id === id)?.name, 'vehicle')}
                                handleViewHistory={(id) => setHistoryModal({ isOpen: true, itemId: id, itemName: dbVehicles.find(v => v.id === id)?.name })}
                                handleEditVehicle={handleEditVehicleClick}
                                isAdmin={isAdmin}
                                isPurchasing={isPurchasing}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Admin Set Water Test Schedule Modal */}
            <Dialog
                open={waterTestModal.isOpen}
                onOpenChange={(open) => !open && setWaterTestModal(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FlaskConical className="w-5 h-5 text-cyan-600" />
                            Set Water Test Schedule
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveWaterTestSchedule} className="p-4 space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0">
                                    Test Title / Laboratory Type
                                </Label>
                                <button
                                    type="button"
                                    onClick={() => setIsAddingTestType(prev => !prev)}
                                    className="text-[11px] font-bold text-cyan-700 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <Plus className="w-3 h-3" />
                                    <span>{isAddingTestType ? 'Cancel' : 'Add New Type'}</span>
                                </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <Select
                                    value={waterTestModal.testType}
                                    onChange={(e) => handleSelectTestType(e.target.value)}
                                    className="h-10 text-xs font-bold bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl flex-1 cursor-pointer"
                                >
                                    {dropdownTestTypes.map((t) => (
                                        <option key={t.id || t.name} value={t.name}>
                                            {t.name} ({t.default_interval_days}d)
                                        </option>
                                    ))}
                                </Select>

                                {selectedTypeObj && typeof selectedTypeObj.id === 'number' && waterTestTypes.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteTestType(selectedTypeObj)}
                                        className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center justify-center transition-colors cursor-pointer"
                                        title="Delete this saved test type"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            {isAddingTestType && (
                                <div className="p-3 rounded-xl bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/70 space-y-2.5 animate-in fade-in duration-150">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800 dark:text-cyan-300 block">
                                        Save New Water Test Type to Database
                                    </span>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="col-span-2">
                                            <Input
                                                type="text"
                                                value={newTestTypeName}
                                                onChange={(e) => setNewTestTypeName(e.target.value)}
                                                placeholder="e.g. Monthly HPC Lab Test"
                                                className="h-9 text-xs bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                        <div>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={newTestTypeInterval}
                                                onChange={(e) => setNewTestTypeInterval(e.target.value)}
                                                placeholder="Days"
                                                title="Default cycle interval (days)"
                                                className="h-9 text-xs font-mono bg-white dark:bg-slate-900"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button
                                            type="button"
                                            onClick={handleAddNewTestType}
                                            disabled={isSavingTestType || isDemo}
                                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer disabled:opacity-50"
                                        >
                                            <Check className="w-3 h-3" />
                                            <span>{isSavingTestType ? 'Saving...' : 'Save & Select Type'}</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Next Scheduled Date
                                </Label>
                                <Input
                                    type="date"
                                    value={waterTestModal.nextTestDate}
                                    onChange={e => setWaterTestModal(prev => ({ ...prev, nextTestDate: e.target.value }))}
                                    required
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Scheduled Time (Manila)
                                </Label>
                                <Input
                                    type="time"
                                    value={waterTestModal.testTime}
                                    onChange={e => setWaterTestModal(prev => ({ ...prev, testTime: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Recurring Cycle Interval (Days)
                            </Label>
                            <Input
                                type="number"
                                min="1"
                                value={waterTestModal.intervalDays}
                                onChange={e => setWaterTestModal(prev => ({ ...prev, intervalDays: e.target.value }))}
                                required
                            />
                            <p className="text-[11px] text-slate-400 mt-1">
                                Automatically advances the next test date by this many days when &ldquo;Log Test Done&rdquo; is clicked.
                            </p>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                Status Note / Instructions
                            </Label>
                            <Textarea
                                rows={3}
                                value={waterTestModal.notes}
                                onChange={e => setWaterTestModal(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="e.g. Water quality parameters are normal. Prepare sterile sample bottles prior to scheduled lab testing."
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setWaterTestModal(prev => ({ ...prev, isOpen: false }))}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={isSavingWaterTest}
                                className="bg-cyan-600 hover:bg-cyan-700 text-white"
                            >
                                {isSavingWaterTest ? 'Saving...' : 'Save Schedule'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Admin Filter Limits Edit Modal */}
            <Dialog
                open={editFilterModal.isOpen}
                onOpenChange={(open) => !open && setEditFilterModal(prev => ({ ...prev, isOpen: false }))}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Sliders className="w-5 h-5 text-emerald-600" />
                            Edit Filter Targets: {editFilterModal.filterName}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveFilterLimits} className="p-4 space-y-4">
                        <div>
                            <Label className="text-xs font-bold text-gray-700">Total Lifespan (Days)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={editFilterModal.lifespanDays}
                                onChange={e => setEditFilterModal(prev => ({ ...prev, lifespanDays: e.target.value }))}
                                required
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Primary trigger for filter replacement.</p>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-gray-700">Volume Capacity Target (Containers)</Label>
                            <Input
                                type="number"
                                min="1"
                                value={editFilterModal.containerLimit}
                                onChange={e => setEditFilterModal(prev => ({ ...prev, containerLimit: e.target.value }))}
                                required
                            />
                            <p className="text-[11px] text-gray-400 mt-1">Calibrates the Gallon Volume Filtered monitoring bar.</p>
                        </div>

                        <div>
                            <Label className="text-xs font-bold text-gray-700">Cost per Piece (₱)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={editFilterModal.cost}
                                onChange={e => setEditFilterModal(prev => ({ ...prev, cost: e.target.value }))}
                                required
                            />
                        </div>

                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditFilterModal(prev => ({ ...prev, isOpen: false }))}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" variant="primary">
                                Save Limits
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Record Custom Date Modal */}
            <Dialog open={recordModal.isOpen} onOpenChange={(open) => !open && setRecordModal(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Maintenance: {recordModal.itemName}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleConfirmRecord} className="p-4 space-y-4">
                        <div>
                            <Label>Date of Replacement/Maintenance</Label>
                            <Input
                                type="datetime-local"
                                value={recordModal.customDate}
                                onChange={e => setRecordModal(prev => ({ ...prev, customDate: e.target.value }))}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRecordModal(prev => ({ ...prev, isOpen: false }))}>Cancel</Button>
                            <Button type="submit" variant="primary">Save Record</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View History Modal */}
            <Dialog open={historyModal.isOpen} onOpenChange={(open) => !open && setHistoryModal(prev => ({ ...prev, isOpen: false }))}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>History: {historyModal.itemName}</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 max-h-96 overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Recorded By</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {fullHistory.filter(h => h.item_id === historyModal.itemId).map(record => (
                                    <TableRow key={record.id}>
                                        <TableCell>{format(new Date(record.replaced_at), 'MMM d, yyyy h:mm a')}</TableCell>
                                        <TableCell className="text-gray-500 text-sm">System User</TableCell>
                                    </TableRow>
                                ))}
                                {fullHistory.filter(h => h.item_id === historyModal.itemId).length === 0 && (
                                    <TableRow><TableCell colSpan={2} className="text-center">No history found.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                    <DialogFooter className="p-4 border-t border-gray-100">
                        <Button variant="outline" onClick={() => setHistoryModal(prev => ({ ...prev, isOpen: false }))}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Manage Vehicles Modal */}
            <Dialog open={manageVehiclesModal} onOpenChange={setManageVehiclesModal}>
                <DialogContent className="max-w-2xl w-full">
                    <DialogHeader><DialogTitle>Manage Vehicles</DialogTitle></DialogHeader>
                    <div className="p-4 space-y-6">
                        <form onSubmit={handleSaveVehicle} className="space-y-4 bg-gray-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label>Vehicle Name</Label>
                                    <Input
                                        value={vehicleForm.name}
                                        onChange={e => setVehicleForm(prev => ({ ...prev, name: e.target.value }))}
                                        placeholder="e.g. Delivery Multicab #1"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Maintenance Interval (Days)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={vehicleForm.lifespanDays}
                                        onChange={e => {
                                            const days = parseInt(e.target.value, 10) || 1;
                                            setVehicleForm(prev => ({
                                                ...prev,
                                                lifespanDays: days,
                                                lifespanMonths: Math.max(1, Math.round(days / 30))
                                            }));
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Last Maintained Date</Label>
                                    <Input
                                        type="date"
                                        value={vehicleForm.lastMaintenanceDate}
                                        onChange={e => setVehicleForm(prev => ({ ...prev, lastMaintenanceDate: e.target.value }))}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label>Maintenance Purpose / Note</Label>
                                    <Input
                                        value={vehicleForm.purpose}
                                        onChange={e => setVehicleForm(prev => ({ ...prev, purpose: e.target.value }))}
                                        placeholder="e.g. Change engine oil, tune-up, filter check"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {vehicleForm.id && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setVehicleForm({
                                            id: null,
                                            name: '',
                                            lifespanDays: 180,
                                            lifespanMonths: 6,
                                            purpose: '',
                                            lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd')
                                        })}
                                    >
                                        Cancel Edit
                                    </Button>
                                )}
                                <Button type="submit">{vehicleForm.id ? 'Update Vehicle' : 'Add Vehicle'}</Button>
                            </div>
                        </form>

                        <div className="max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-xl">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Interval (Days)</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dbVehicles.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.name}</TableCell>
                                            <TableCell>{v.lifespan_days || (v.lifespan_months ? v.lifespan_months * 30 : 180)} Days</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <button onClick={() => handleEditVehicleClick(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteVehicle(v.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t border-gray-100">
                        <Button variant="outline" onClick={() => setManageVehiclesModal(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}