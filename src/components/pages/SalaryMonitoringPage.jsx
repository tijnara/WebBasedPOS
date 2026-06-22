// src/components/pages/SalaryMonitoringPage.jsx
import React, { useState, useMemo } from 'react';
import { 
    Card, CardHeader, CardContent, Button, Input, Label, Select, 
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui';
import { useSalaryRecords, useCreateSalary } from '../../hooks/useSalary';
import { useEmployees, useManageEmployee } from '../../hooks/useEmployees';
import currency from 'currency.js';
import { format, endOfMonth, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Users, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';

// --- Date Math Helpers ---
const getInitialPeriod = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    // If today is 1st-15th, show 1st-15th. If 16th+, show 16th-End.
    if (day <= 15) {
        return {
            start: format(new Date(year, month, 1), 'yyyy-MM-dd'),
            end: format(new Date(year, month, 15), 'yyyy-MM-dd')
        };
    } else {
        return {
            start: format(new Date(year, month, 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(today), 'yyyy-MM-dd')
        };
    }
};

const getPrevPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 16) {
        // Move back to 1st-15th of the SAME month
        return {
            start: format(new Date(year, month, 1), 'yyyy-MM-dd'),
            end: format(new Date(year, month, 15), 'yyyy-MM-dd')
        };
    } else {
        // Move back to 16th-End of PREVIOUS month
        const prevMonthDate = subMonths(currentStart, 1);
        return {
            start: format(new Date(prevMonthDate.getFullYear(), prevMonthDate.getMonth(), 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(prevMonthDate), 'yyyy-MM-dd')
        };
    }
};

const getNextPeriod = (currentStartStr) => {
    const currentStart = new Date(currentStartStr);
    const year = currentStart.getFullYear();
    const month = currentStart.getMonth();
    const day = currentStart.getDate();

    if (day === 1) {
        // Move forward to 16th-End of SAME month
        return {
            start: format(new Date(year, month, 16), 'yyyy-MM-dd'),
            end: format(endOfMonth(currentStart), 'yyyy-MM-dd')
        };
    } else {
        // Move forward to 1st-15th of NEXT month
        const nextMonthDate = addMonths(currentStart, 1);
        return {
            start: format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 1), 'yyyy-MM-dd'),
            end: format(new Date(nextMonthDate.getFullYear(), nextMonthDate.getMonth(), 15), 'yyyy-MM-dd')
        };
    }
};

export default function SalaryMonitoringPage() {
    const { user, addToast } = useStore();
    const isAdmin = user?.role === 'Admin' || user?.role === 'admin' || user?.isadmin;
    
    const [period, setPeriod] = useState(getInitialPeriod());
    const [filterEmployee, setFilterEmployee] = useState('all');

    const { data: salaryRecords, isLoading: isSalaryLoading } = useSalaryRecords(period.start, period.end);
    const { data: employees, isLoading: isEmpLoading } = useEmployees();
    const createSalary = useCreateSalary();
    const manageEmployee = useManageEmployee();

    // Salary Form State
    const [employeeName, setEmployeeName] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [description, setDescription] = useState('Salary Payout');

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
        if (!employeeName || !amount || !date) return;

        try {
            await createSalary.mutateAsync({ employeeName, amount, description, date });
            addToast({ title: 'Success', description: 'Salary recorded successfully', variant: 'success' });
            setAmount('');
            setEmployeeName(''); 
            setDescription('Salary Payout');
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
        <div className="p-6 space-y-6 responsive-page max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Salary Monitoring</h1>
                    <p className="text-gray-500 text-sm">Manage staff salaries and records.</p>
                </div>
                <Button onClick={() => setIsManageModalOpen(true)} className="flex items-center gap-2 bg-slate-800 text-white hover:bg-slate-700">
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
                            {/* Changed to a Select dropdown */}
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
                            <Label>Date</Label>
                            <Input type="date" value={date} onChange={e => setDate(e.target.value)} required className="h-11" />
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

            {/* BI-MONTHLY HISTORY */}
            <Card>
                <CardHeader className="flex flex-row justify-between items-center border-b border-gray-100 pb-4">
                    <div className="flex-1">
                        <h3 className="font-bold">Salary History</h3>
                        <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-semibold">
                            Period: {format(new Date(period.start), 'MMM d, yyyy')} — {format(new Date(period.end), 'MMM d, yyyy')}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
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
                </CardHeader>
                <CardContent className="p-0">
    {/* DESKTOP TABLE */}
    <div className="hidden md:block">
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {isSalaryLoading ? (
                    <TableRow><TableCell colSpan="4" className="text-center py-6 text-gray-500">Loading...</TableCell></TableRow>
                ) : filteredRecords?.length === 0 ? (
                    <TableRow><TableCell colSpan="4" className="text-center py-8 text-gray-500 font-medium">No salary records for this period.</TableCell></TableRow>
                ) : (
                    filteredRecords?.map(record => (
                        <TableRow key={record.id}>
                            <TableCell>{format(new Date(record.expense_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="font-bold text-gray-800">{record.employee_name || 'N/A'}</TableCell>
                            <TableCell className="text-gray-500">{record.description}</TableCell>
                            <TableCell className="text-right text-red-600 font-bold">
                                {currency(record.amount, { symbol: '₱' }).format()}
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    </div>

    {/* MOBILE LIST VIEW */}
    <div className="block md:hidden p-4">
        {isSalaryLoading ? (
            <p className="text-center py-6 text-gray-500">Loading...</p>
        ) : filteredRecords?.length === 0 ? (
            <p className="text-center py-8 text-gray-500 font-medium">No salary records for this period.</p>
        ) : (
            <div className="space-y-4">
                {filteredRecords?.map(record => (
                    <div key={record.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <span className="font-bold text-gray-800">{record.employee_name || 'N/A'}</span>
                            <span className="text-red-600 font-bold">{currency(record.amount, { symbol: '₱' }).format()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                            <span>{record.description}</span>
                            <span>{format(new Date(record.expense_date), 'MMM d, yyyy')}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
    
    {/* PAGINATION / PERIOD NAVIGATION */}
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-b-lg border-t border-gray-100">
        <button
            onClick={() => setPeriod(getPrevPeriod(period.start))}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
            <ChevronLeft className="w-4 h-4" /> Previous Period
        </button>
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {format(new Date(period.start), 'MMM d')} - {format(new Date(period.end), 'MMM d')}
        </span>
        <button
            onClick={() => setPeriod(getNextPeriod(period.start))}
            className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
        >
            Next Period <ChevronRight className="w-4 h-4" />
        </button>
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
                        {/* Add / Edit Form */}
                        <form onSubmit={handleSaveEmployee} className="flex flex-col md:flex-row gap-2 items-end bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <div className="flex-1 w-full">
                                <Label>Employee Name</Label>
                                <Input value={empFormName} onChange={e => setEmpFormName(e.target.value)} placeholder="e.g. Jane Doe" required />
                            </div>
                            <div className="flex-1 w-full">
                                <Label>Default Salary (₱)</Label>
                                <Input type="number" step="0.01" value={empFormSalary} onChange={e => setEmpFormSalary(e.targe.value)} placeholder="e.g. 5000" />
                            </div>
                            <div className="flex gap-2 w-full md:w-auto">
                                {editingEmpId && (
                                    <Button type="button" variant="ghost" onClick={() => { setEditingEmpId(null); setEmpFormName(''); setEmpFormSalary(''); }} className="w-full">Cancel</Button>
                                )}
                                <Button type="submit" disabled={manageEmployee.isPending} className="bg-blue-600 text-white hover:bg-blue-700 w-full">
                                    {editingEmpId ? 'Update' : 'Add Employee'}
                                </Button>
                            </div>
                        </form>

                        {/* Employee List - Desktop */}
                        <div className="hidden md:block max-h-80 overflow-y-auto border rounded-lg">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Default Salary</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isEmpLoading ? (
                                        <TableRow><TableCell colSpan="3" className="text-center">Loading...</TableCell></TableRow>
                                    ) : employees?.length === 0 ? (
                                        <TableRow><TableCell colSpan="3" className="text-center text-gray-500">No employees registered.</TableCell></TableRow>
                                    ) : (
                                        employees?.map(emp => (
                                            <TableRow key={emp.id}>
                                                <TableCell className="font-medium">{emp.name}</TableCell>
                                                <TableCell>{currency(emp.default_salary, { symbol: '₱' }).format()}</TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    <button onClick={() => handleEditClick(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        
                        {/* Employee List - Mobile */}
                        <div className="block md:hidden space-y-3">
                            {isEmpLoading ? (
                                <p className="text-center text-gray-500">Loading...</p>
                            ) : employees?.length === 0 ? (
                                <p className="text-center text-gray-500">No employees registered.</p>
                            ) : (
                                employees?.map(emp => (
                                    <div key={emp.id} className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-800">{emp.name}</p>
                                            <p className="text-sm text-gray-500">{currency(emp.default_salary, { symbol: '₱' }).format()}</p>
                                        </div>
                                        <div className="space-x-2">
                                            <button onClick={() => handleEditClick(emp)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md">
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button onClick={() => handleDeleteEmployee(emp.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t">
                        <Button variant="outline" onClick={() => setIsManageModalOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}