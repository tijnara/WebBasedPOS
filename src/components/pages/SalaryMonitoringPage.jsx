// src/components/pages/SalaryMonitoringPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
    Card, CardHeader, CardContent, Button, Input, Label, Select, 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui';
import { useSalaryRecords, useCreateSalary } from '../../hooks/useSalary';
import { useEmployees, useManageEmployee } from '../../hooks/useEmployees';
import currency from 'currency.js';
import { format, endOfMonth, subMonths, addMonths, startOfDay, endOfDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Edit2, Trash2, Calendar } from 'lucide-react';
import { useStore } from '../../store/useStore';

// --- Date Math Helpers ---
const getInitialPeriod = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (day <= 15) {
        return {
            start: format(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        return {
            start: format(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(today)), 'yyyy-MM-dd')
        };
    }
};

const getPrevPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 16) {
        return {
            start: format(startOfDay(new Date(year, month, 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(year, month, 15)), 'yyyy-MM-dd')
        };
    } else {
        const prevMonthDate = subMonths(currentStart, 1);
        return {
            start: format(startOfDay(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(prevMonthDate)), 'yyyy-MM-dd')
        };
    }
};

const getNextPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        return {
            start: format(startOfDay(new Date(year, month, 16)), 'yyyy-MM-dd'),
            end: format(endOfDay(endOfMonth(currentStart)), 'yyyy-MM-dd')
        };
    } else {
        const nextMonthDate = addMonths(currentStart, 1);
        return {
            start: format(startOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1)), 'yyyy-MM-dd'),
            end: format(endOfDay(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15)), 'yyyy-MM-dd')
        };
    }
};

export default function SalaryMonitoringPage() {
    useEffect(() => {
        document.title = 'Salary Monitoring | Seaside WRS';
    }, []);

    const { user, addToast } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin;
    
    const [period, setPeriod] = useState(getInitialPeriod());
    const [filterEmployee, setFilterEmployee] = useState('all');
    
    // State for custom date range
    const [customStartDate, setCustomStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [customEndDate, setCustomEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isCustomRangeActive, setIsCustomRangeActive] = useState(false);


    const { data: salaryRecords, isLoading: isSalaryLoading } = useSalaryRecords(period.start, period.end);
    const { data: employees, isLoading: isEmpLoading } = useEmployees();
    const createSalary = useCreateSalary();
    const manageEmployee = useManageEmployee();

    // Salary Form State
    const [employeeName, setEmployeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('Salary Payout');
    const [payoutDate, setPayoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));


    // Employee Modal State
    const [isManageModalOpen, setIsManageModalOpen] = useState(false);
    const [editingEmpId, setEditingEmpId] = useState(null);
    const [empFormName, setEmpFormName] = useState('');
    const [empFormSalary, setEmpFormSalary] = useState('');

    const filteredRecords = useMemo(() => {
        if (filterEmployee === 'all') {
            return salaryRecords;
        }
        return salaryRecords?.filter(r => r.employee_name === filterEmployee);
    }, [salaryRecords, filterEmployee]);

    const periodTotal = useMemo(() => {
        return filteredRecords?.reduce((sum, record) => sum + Number(record.amount), 0) || 0;
    }, [filteredRecords]);

    if (!isAdmin) {
        return <div className="p-10 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
    }

    // --- DATE FILTER LOGIC ---
    const handleApplyCustomDate = () => {
        if (customStartDate && customEndDate) {
            setPeriod({
                start: customStartDate,
                end: customEndDate
            });
            setIsCustomRangeActive(true);
        }
    };
    
    const handleSetPeriod = (newPeriod) => {
        setPeriod(newPeriod);
        setIsCustomRangeActive(false);
    };


    // --- SALARY FORM LOGIC ---
    const handleEmployeeSelect = (e) => {
        const val = e.target.value;
        setEmployeeName(val);
        
        const match = employees?.find(emp => emp.name === val);
        if (match && match.default_salary > 0) {
            setAmount(match.default_salary);
        }
    };

    const handleAddSalary = async (e) => {
        e.preventDefault();
        if (!employeeName || !amount || !payoutDate) return;
    
        // 1. Get the current time
        const now = new Date();
        
        // 2. Parse the selected payoutDate (YYYY-MM-DD)
        const [year, month, day] = payoutDate.split('-').map(Number);
        
        // 3. Combine the selected date with the current time
        const combinedDateTime = new Date(year, month - 1, day, now.getHours(), now.getMinutes(), now.getSeconds());

        try {
            await createSalary.mutateAsync({ 
                employeeName, 
                amount, 
                description, 
                // 4. Send the combined date and time
                date: combinedDateTime.toISOString() 
            });
            addToast({ title: 'Success', description: 'Salary recorded successfully', variant: 'success' });
            setAmount('');
            setEmployeeName(''); 
            setDescription('Salary Payout');
            setPayoutDate(format(new Date(), 'yyyy-MM-dd'));
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    // --- EMPLOYEE MANAGEMENT LOGIC ---
    const handleSaveEmployee = async (e) => {
        e.preventDefault();
        if (!empFormName.trim()) return;

        try {
            if (editingEmpId) {
                await manageEmployee.mutateAsync({ action: 'EDIT', employee: { id: editingEmpId, name: empFormName, default_salary: empFormSalary } });
                addToast({ title: 'Updated', description: 'Employee updated.', variant: 'success' });
            } else {
                await manageEmployee.mutateAsync({ action: 'ADD', employee: { name: empFormName, default_salary: empFormSalary } });
                addToast({ title: 'Added', description: 'New employee added.', variant: 'success' });
            }
            setEditingEmpId(null);
            setEmpFormName('');
            setEmpFormSalary('');
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    const handleEditClick = (emp) => {
        setEditingEmpId(emp.id);
        setEmpFormName(emp.name);
        setEmpFormSalary(emp.default_salary);
    };

    const handleDeleteEmployee = async (id) => {
        if (!window.confirm("Delete this employee profile? Past salaries will still show in history.")) return;
        try {
            await manageEmployee.mutateAsync({ action: 'DELETE', employee: { id } });
            addToast({ title: 'Deleted', description: 'Employee removed.', variant: 'success' });
        } catch (error) {
            addToast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    };

    return (
        <div className="p-6 space-y-6 responsive-page max-w-7xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Salary Monitoring</h1>
                    <p className="text-gray-500 text-sm">Manage staff salaries and records.</p>
                </div>
                <Button 
                    onClick={() => setIsManageModalOpen(true)} 
                    className="flex items-center gap-2 btn-apple-green text-white"
                >
                    <Users className="w-4 h-4" /> Manage Employees
                </Button>
            </div>

            {/* RECORD SALARY FORM */}
            <Card>
                <CardHeader className="bg-blue-50 border-b border-blue-100">
                    <h3 className="font-bold text-blue-800">Record Salary Payment</h3>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleAddSalary} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <Label>Employee</Label>
                            <Select value={employeeName} onChange={handleEmployeeSelect} required className="h-11">
                                <option value="" disabled>Select Staff...</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                                ))}
                            </Select>
                        </div>
                        <div className="md:col-span-1">
                            <Label>Amount (₱)</Label>
                            <Input type="number" step="0.01" min="1" value={amount} onChange={e => setAmount(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Label>Payout Date</Label>
                            <Input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Label>Description</Label>
                            <Input type="text" value={description} onChange={e => setDescription(e.target.value)} required className="h-11" />
                        </div>
                        <div className="md:col-span-1">
                            <Button type="submit" disabled={createSalary.isPending} className="btn--primary w-full h-11">
                                {createSalary.isPending ? 'Saving...' : 'Record'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* SALARY HISTORY & FILTERS */}
            <Card>
                <CardHeader className="border-b border-gray-100 pb-4 space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1">
                            <h3 className="font-bold">Salary History</h3>
                            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                                Period: {format(new Date(period.start), 'EEE, MMM d, yyyy')} — {format(new Date(period.end), 'EEE, MMM d, yyyy')}
                            </p>
                        </div>
                        <div className="flex items-center gap-4 mt-4 md:mt-0">
                            <div className="w-48">
                                <Select value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)}>
                                    <option value="all">All Employees</option>
                                    {employees?.map(emp => (
                                        <option key={emp.id} value={emp.name}>{emp.name}</option>
                                    ))}
                                </Select>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Period Total</p>
                                <p className="text-xl font-bold text-red-600">{currency(periodTotal, { symbol: '₱' }).format()}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Custom Date Filter */}
                    <div className="flex flex-col md:flex-row items-center gap-2 p-3 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <Label className="font-semibold text-sm">Custom Date Range:</Label>
                        <Input 
                            type="date" 
                            value={customStartDate} 
                            onChange={e => setCustomStartDate(e.target.value)}
                            className="h-9 max-w-xs"
                        />
                        <span className="text-gray-500">-</span>
                        <Input 
                            type="date" 
                            value={customEndDate} 
                            onChange={e => setCustomEndDate(e.target.value)}
                            className="h-9 max-w-xs"
                        />
                        <Button onClick={handleApplyCustomDate} className="h-9 btn-primary">Apply</Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Table and List Views */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Employee</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isSalaryLoading ? <TableRow><TableCell colSpan="4" className="text-center py-6">Loading...</TableCell></TableRow> :
                                filteredRecords?.length === 0 ? <TableRow><TableCell colSpan="4" className="text-center py-8">No records for this period.</TableCell></TableRow> :
                                filteredRecords?.map(record => (
                                    <TableRow key={record.id} className="border-b">
                                        <TableCell>{format(new Date(record.expense_date), 'EEE, MMM d, yyyy h:mm a')}</TableCell>
                                        <TableCell className="font-bold">{record.employee_name || 'N/A'}</TableCell>
                                        <TableCell>{record.description}</TableCell>
                                        <TableCell className="text-right font-bold text-red-600">{currency(record.amount, { symbol: '₱' }).format()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                    <div className="block md:hidden p-4 space-y-4">
                        {isSalaryLoading ? <p className="text-center py-6">Loading...</p> :
                        filteredRecords?.length === 0 ? <p className="text-center py-8">No records for this period.</p> :
                        filteredRecords?.map(record => (
                            <div key={record.id} className="bg-white p-4 rounded-xl shadow-sm border-b">
                                <div className="flex justify-between items-start"><span className="font-bold">{record.employee_name || 'N/A'}</span><span className="font-bold text-red-600">{currency(record.amount, { symbol: '₱' }).format()}</span></div>
                                <div className="flex justify-between items-center text-sm text-gray-500 mt-2"><span>{record.description}</span><span>{format(new Date(record.expense_date), 'EEE, MMM d, h:mm a')}</span></div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Period Navigation */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg border-t">
                        <Button
                            onClick={() => handleSetPeriod(getPrevPeriod(period.start))}
                            disabled={isCustomRangeActive}
                            variant="outline"
                            className="flex items-center gap-1 disabled:opacity-50"
                        >
                            <ChevronLeft className="w-4 h-4" /> Prev 15-Day
                        </Button>
                        <span className="text-xs font-bold text-gray-400 uppercase">
                           {isCustomRangeActive ? "Custom Range" : `${format(new Date(period.start), 'MMM d')} - ${format(new Date(period.end), 'MMM d')}`}
                        </span>
                        <Button
                            onClick={() => handleSetPeriod(getNextPeriod(period.start))}
                            disabled={isCustomRangeActive}
                            variant="outline"
                            className="flex items-center gap-1 disabled:opacity-50"
                        >
                            Next 15-Day <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* EMPLOYEE MANAGEMENT MODAL */}
            <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
                <DialogContent className="max-w-2xl w-full">
                    <DialogHeader>
                        <DialogTitle>Manage Employees</DialogTitle>
                    </DialogHeader>
                    <div className="p-4 space-y-6">
                        <form onSubmit={handleSaveEmployee} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><Label>Employee Name</Label><Input value={empFormName} onChange={e => setEmpFormName(e.target.value)} required /></div>
                                <div><Label>Default Salary (₱)</Label><Input type="number" step="0.01" value={empFormSalary} onChange={e => setEmpFormSalary(e.target.value)} /></div>
                            </div>
                            <div className="flex justify-end gap-2">
                                {editingEmpId && <Button type="button" variant="ghost" onClick={() => { setEditingEmpId(null); setEmpFormName(''); setEmpFormSalary(''); }}>Cancel</Button>}
                                <Button type="submit" disabled={manageEmployee.isPending}>{editingEmpId ? 'Update' : 'Add Employee'}</Button>
                            </div>
                        </form>
                        <div className="max-h-80 overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Default Salary</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isEmpLoading ? <TableRow><TableCell colSpan="3" className="text-center">Loading...</TableCell></TableRow> :
                                    employees?.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.name}</TableCell>
                                            <TableCell>{currency(emp.default_salary, { symbol: '₱' }).format()}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <button onClick={() => handleEditClick(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md"><Edit2 className="w-4 h-4" /></button>
                                                <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md"><Trash2 className="w-4 h-4" /></button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => setIsManageModalOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}