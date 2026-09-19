// src/components/tracking/MaintenanceTrackingPage.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { useCreateExpense } from '../../hooks/useExpenses';
import { startOfWeek, addWeeks, addMonths, format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui';
import { Plus, History, Edit2, Trash2, X } from 'lucide-react';

// Extracted Components
import PendingPurchases from '../tracking/PendingPurchases';
import FilterList from '../tracking/FilterList';
import VehicleList from '../tracking/VehicleList';
import { FILTER_CONFIG } from '../../config/constants';

export default function MaintenanceTrackingPage() {
    const { user, addToast } = useStore();
    const isDemo = user?.isDemo;
    const queryClient = useQueryClient();

    const [trackingData, setTrackingData] = useState({});
    const [usageData, setUsageData] = useState({});
    const [dbVehicles, setDbVehicles] = useState([]);
    const [fullHistory, setFullHistory] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    // New Modals State
    const [recordModal, setRecordModal] = useState({ isOpen: false, itemId: null, itemType: null, itemName: '', customDate: format(new Date(), "yyyy-MM-dd'T'HH:mm") });
    const [historyModal, setHistoryModal] = useState({ isOpen: false, itemId: null, itemName: '' });
    const [manageVehiclesModal, setManageVehiclesModal] = useState(false);

    // Vehicle Form State - Added lastMaintenanceDate
    const [vehicleForm, setVehicleForm] = useState({
        id: null,
        name: '',
        lifespanMonths: 6,
        purpose: '',
        lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd')
    });

    const createExpense = useCreateExpense();

    const fetchTrackingData = async () => {
        setIsLoading(true);
        if (isDemo) return;

        try {
            const [vehiclesRes, historyRes] = await Promise.all([
                supabase.from('vehicles').select('*').order('created_at', { ascending: true }),
                supabase.from('maintenance_history').select('*').order('replaced_at', { ascending: false })
            ]);

            if (vehiclesRes.error) throw vehiclesRes.error;
            if (historyRes.error) throw historyRes.error;

            setDbVehicles(vehiclesRes.data || []);
            setFullHistory(historyRes.data || []);

            const latestDates = {};
            (historyRes.data || []).forEach(record => {
                if (!latestDates[record.item_id]) {
                    latestDates[record.item_id] = record.replaced_at;
                }
            });
            setTrackingData(latestDates);

            const mappedUsage = {};
            for (const filter of FILTER_CONFIG) {
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
            checkNotifications(latestDates, mappedUsage, vehiclesRes.data || []);
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

    const checkNotifications = (dates, usages, vehicles) => {
        let overdueItems = [];

        FILTER_CONFIG.forEach(filter => {
            const lastReplaced = dates[filter.id] ? new Date(dates[filter.id]) : new Date();
            const daysPassed = Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24));
            const containersSold = usages[filter.id] || 0;
            if (daysPassed >= filter.lifespanDays || containersSold >= filter.containerLimit) {
                overdueItems.push(filter.name);
            }
        });

        if (overdueItems.length > 0) {
            addToast({
                title: 'Filter Replacement Required!',
                description: `Filters overdue by time or usage: ${overdueItems.join(', ')}`,
                variant: 'destructive'
            });
        }
    };

    const processedFilters = FILTER_CONFIG.map(filter => {
        const lastReplaced = trackingData[filter.id] ? new Date(trackingData[filter.id]) : new Date();
        const daysPassed = Math.floor((new Date() - lastReplaced) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, filter.lifespanDays - daysPassed);
        const timePercent = Math.min(100, (daysPassed / filter.lifespanDays) * 100);

        const containersSold = usageData[filter.id] || 0;
        const usagePercent = Math.min(100, (containersSold / filter.containerLimit) * 100);

        return {
            ...filter,
            daysPassed, daysLeft, timePercent, isTimeOverdue: daysLeft === 0,
            containersSold, containersLeft: Math.max(0, filter.containerLimit - containersSold),
            usagePercent, isUsageOverdue: containersSold >= filter.containerLimit,
            isOverdue: (daysLeft === 0 || containersSold >= filter.containerLimit)
        };
    });

    const processedVehicles = dbVehicles.map(vehicle => {
        const lastReplaced = trackingData[vehicle.id] ? new Date(trackingData[vehicle.id]) : new Date();
        const dueDate = addMonths(lastReplaced, vehicle.lifespan_months);
        const now = new Date();

        const daysPassed = Math.floor((now - lastReplaced) / (1000 * 60 * 60 * 24));
        const totalLifespanDays = Math.floor((dueDate - lastReplaced) / (1000 * 60 * 60 * 24));
        const daysLeft = Math.max(0, totalLifespanDays - daysPassed);
        const timePercent = Math.min(100, (daysPassed / totalLifespanDays) * 100);

        return {
            ...vehicle,
            daysPassed, daysLeft, timePercent, isOverdue: daysLeft === 0, totalLifespanDays
        };
    });

    const overdueFilters = processedFilters.filter(f => f.isOverdue);
    const totalOverdueCost = overdueFilters.reduce((sum, f) => sum + (f.cost * f.pcs), 0);
    const overdueVehicles = processedVehicles.filter(v => v.isOverdue);

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
            addToast({ title: 'Success', description: 'Maintenance record saved.', variant: 'success' });
            setRecordModal({ isOpen: false, itemId: null, itemType: null, itemName: '', customDate: '' });
            queryClient.invalidateQueries({ queryKey: ['overdue-vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
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
                const weeklyCost = (filter.cost * filter.pcs) / filter.lifespanWeeks;
                for (let i = 0; i < filter.lifespanWeeks; i++) {
                    expensePromises.push(
                        createExpense.mutateAsync({
                            amount: weeklyCost.toFixed(2),
                            category: 'Maintenance',
                            description: `Filter Replacement (${filter.name}) - Week ${i + 1}/${filter.lifespanWeeks}`,
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

            addToast({ title: 'Purchase Recorded', description: 'Expenses amortized and counters reset.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['overdue-vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            fetchTrackingData();
        } catch (error) {
            addToast({ title: 'Error', description: error.message || 'Failed to record expenses.', variant: 'destructive' });
        } finally {
            setIsPurchasing(false);
        }
    };

    // --- Vehicle CRUD Logic ---
    const handleSaveVehicle = async (e) => {
        e.preventDefault();
        if (isDemo) return;

        try {
            let vehicleId = vehicleForm.id;

            if (vehicleId) {
                const { error } = await supabase.from('vehicles').update({
                    name: vehicleForm.name,
                    lifespan_months: vehicleForm.lifespanMonths,
                    purpose: vehicleForm.purpose
                }).eq('id', vehicleId);

                if (error) throw error;
                addToast({ title: 'Updated', description: 'Vehicle updated successfully.', variant: 'success' });
            } else {
                // Must select() to get the newly generated ID back
                const { data, error } = await supabase.from('vehicles').insert({
                    name: vehicleForm.name,
                    lifespan_months: vehicleForm.lifespanMonths,
                    purpose: vehicleForm.purpose
                }).select().single();

                if (error) throw error;
                vehicleId = data.id;
                addToast({ title: 'Added', description: 'New vehicle added.', variant: 'success' });
            }

            // Sync the chosen date into the history table
            const currentTrackedDate = trackingData[vehicleId] ? format(new Date(trackingData[vehicleId]), 'yyyy-MM-dd') : null;

            // If it's a new vehicle, or the user actively changed the date in the form, create a history record
            if (!currentTrackedDate || currentTrackedDate !== vehicleForm.lastMaintenanceDate) {
                // Append midday time to safely store it
                const dateObj = new Date(`${vehicleForm.lastMaintenanceDate}T12:00:00`);
                const { error: historyError } = await supabase.from('maintenance_history').insert({
                    item_id: vehicleId,
                    item_type: 'vehicle',
                    replaced_at: dateObj.toISOString(),
                    replaced_by: user?.id || null
                });
                if (historyError) throw historyError;
            }

            setVehicleForm({ id: null, name: '', lifespanMonths: 6, purpose: '', lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd') });
            queryClient.invalidateQueries({ queryKey: ['overdue-vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            await fetchTrackingData();
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleDeleteVehicle = async (id) => {
        if (!window.confirm("Delete this vehicle? Its history will remain but detached.")) return;

        const { error } = await supabase.from('vehicles').delete().eq('id', id);
        if (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        } else {
            addToast({ title: 'Deleted', description: 'Vehicle removed.', variant: 'success' });
            queryClient.invalidateQueries({ queryKey: ['overdue-vehicles'] });
            queryClient.invalidateQueries({ queryKey: ['maintenance-alerts'] });
            fetchTrackingData();
        }
    };

    const handleEditVehicleClick = (v) => {
        const lastDate = trackingData[v.id]
            ? format(new Date(trackingData[v.id]), 'yyyy-MM-dd')
            : format(new Date(), 'yyyy-MM-dd');

        setVehicleForm({
            id: v.id,
            name: v.name,
            lifespanMonths: v.lifespan_months,
            purpose: v.purpose,
            lastMaintenanceDate: lastDate
        });
    };

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">Filter & Maintenance Tracking</h1>
                    <p className="text-gray-500 text-xs mt-0.5">Monitor water filters and vehicle maintenance.</p>
                </div>
                <Button onClick={() => setManageVehiclesModal(true)} className="btn-primary">
                    Manage Vehicles
                </Button>
            </div>

            {isLoading ? (
                <div className="text-center py-10 text-gray-500">Loading tracking data...</div>
            ) : (
                <div className="flex flex-col lg:flex-row gap-6 items-start">
                    <div className="w-full lg:w-80 shrink-0 order-first lg:order-last">
                        <PendingPurchases
                            overdueFilters={overdueFilters}
                            totalOverdueCost={totalOverdueCost}
                            handlePurchaseAndRecord={handlePurchaseAndRecord}
                            isPurchasing={isPurchasing}
                            isDemo={isDemo}
                        />
                    </div>

                    <div className="flex-1 w-full order-last lg:order-first flex flex-col space-y-6">
                        <FilterList
                            processedFilters={processedFilters}
                            handleReplace={(id) => handleOpenRecordModal(id, FILTER_CONFIG.find(f=>f.id===id)?.name, 'filter')}
                            handleViewHistory={(id) => setHistoryModal({ isOpen: true, itemId: id, itemName: FILTER_CONFIG.find(f=>f.id===id)?.name })}
                            isPurchasing={isPurchasing}
                        />
                        <VehicleList
                            processedVehicles={processedVehicles}
                            handleReplace={(id) => handleOpenRecordModal(id, dbVehicles.find(v=>v.id===id)?.name, 'vehicle')}
                            handleViewHistory={(id) => setHistoryModal({ isOpen: true, itemId: id, itemName: dbVehicles.find(v=>v.id===id)?.name })}
                            isPurchasing={isPurchasing}
                        />
                    </div>
                </div>
            )}

            {/* Record Custom Date Modal */}
            <Dialog open={recordModal.isOpen} onOpenChange={(open) => !open && setRecordModal(prev => ({...prev, isOpen: false}))}>
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
                                onChange={e => setRecordModal(prev => ({...prev, customDate: e.target.value}))}
                                required
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setRecordModal(prev => ({...prev, isOpen: false}))}>Cancel</Button>
                            <Button type="submit" variant="primary">Save Record</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* View History Modal */}
            <Dialog open={historyModal.isOpen} onOpenChange={(open) => !open && setHistoryModal(prev => ({...prev, isOpen: false}))}>
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
                        <Button variant="outline" onClick={() => setHistoryModal(prev => ({...prev, isOpen: false}))}>
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
                        <form onSubmit={handleSaveVehicle} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label>Vehicle Name</Label>
                                    <Input value={vehicleForm.name} onChange={e => setVehicleForm(prev => ({...prev, name: e.target.value}))} required />
                                </div>
                                <div>
                                    <Label>Interval (Months)</Label>
                                    <Input type="number" min="1" value={vehicleForm.lifespanMonths} onChange={e => setVehicleForm(prev => ({...prev, lifespanMonths: e.target.value}))} required />
                                </div>
                                <div>
                                    <Label>Last Maintained Date</Label>
                                    <Input type="date" value={vehicleForm.lastMaintenanceDate} onChange={e => setVehicleForm(prev => ({...prev, lastMaintenanceDate: e.target.value}))} required />
                                </div>
                                <div className="md:col-span-3">
                                    <Label>Maintenance Purpose / Note</Label>
                                    <Input value={vehicleForm.purpose} onChange={e => setVehicleForm(prev => ({...prev, purpose: e.target.value}))} required />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {vehicleForm.id && <Button type="button" variant="ghost" onClick={() => setVehicleForm({ id: null, name: '', lifespanMonths: 6, purpose: '', lastMaintenanceDate: format(new Date(), 'yyyy-MM-dd') })}>Cancel Edit</Button>}
                                <Button type="submit">{vehicleForm.id ? 'Update Vehicle' : 'Add Vehicle'}</Button>
                            </div>
                        </form>

                        <div className="max-h-80 overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Interval</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {dbVehicles.map(v => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.name}</TableCell>
                                            <TableCell>{v.lifespan_months} Months</TableCell>
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