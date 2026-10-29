// src/components/salary/EmployeeManagementModal.jsx
import React from 'react';
import currency from 'currency.js';
import {
    Button, Input, Label, Select,
    Dialog, DialogContent, DialogTitle
} from '../ui';
import { Users, Plus, Pencil, Trash2, X, Check, Banknote, UserCheck } from 'lucide-react';

export default function EmployeeManagementModal({
                                                    isManageModalOpen,
                                                    setIsManageModalOpen,
                                                    handleSaveEmployee,
                                                    empFormName,
                                                    setEmpFormName,
                                                    empFormSalaryType,
                                                    setEmpFormSalaryType,
                                                    empFormSalary,
                                                    setEmpFormSalary,
                                                    empFormMultiplier,
                                                    setEmpFormMultiplier,
                                                    editingEmpId,
                                                    setEditingEmpId,
                                                    isPending,
                                                    isEmpLoading,
                                                    employees = [],
                                                    handleEditClick,
                                                    handleDeleteEmployee
                                                }) {
    const handleClose = () => {
        setIsManageModalOpen(false);
        setEditingEmpId(null);
        setEmpFormName('');
        setEmpFormSalary('');
        setEmpFormSalaryType('per_day');
        setEmpFormMultiplier('');
    };

    const getInitials = (name = '') => {
        return name
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(w => w[0]?.toUpperCase())
            .join('') || 'EM';
    };

    return (
        <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
            <DialogContent className="p-0 sm:max-w-2xl w-full bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden rounded-3xl dark:[color-scheme:dark] transition-colors">

                {/* Modal Header */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-lime-100 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0 shadow-2xs">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                                Manage Employees
                            </DialogTitle>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Configure staff wage structures, daily rates, and container commission multipliers.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">

                    {/* Add / Edit Form Card */}
                    <form onSubmit={handleSaveEmployee} className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                <UserCheck className="w-4 h-4 text-[#8DB600] dark:text-lime-400" />
                                {editingEmpId ? 'Edit Employee Details' : 'Add New Employee'}
                            </span>
                            {editingEmpId && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditingEmpId(null);
                                        setEmpFormName('');
                                        setEmpFormSalary('');
                                        setEmpFormSalaryType('per_day');
                                        setEmpFormMultiplier('');
                                    }}
                                    className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                                >
                                    Cancel Edit
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Employee Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    value={empFormName}
                                    onChange={(e) => setEmpFormName(e.target.value)}
                                    required
                                    placeholder="e.g. Junar Garcia"
                                    className="h-10 mt-1 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#8DB600] focus:ring-[#8DB600]"
                                />
                            </div>

                            <div>
                                <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    Salary Type
                                </Label>
                                <Select
                                    value={empFormSalaryType}
                                    onChange={(e) => setEmpFormSalaryType(e.target.value)}
                                    className="h-10 mt-1 w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-[#8DB600]"
                                >
                                    <option value="per_day" className="bg-white dark:bg-slate-900">Per Day (Fixed Rate)</option>
                                    <option value="per_container" className="bg-white dark:bg-slate-900">Per Container (Commission)</option>
                                </Select>
                            </div>

                            {empFormSalaryType === 'per_day' ? (
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Daily Wage Rate (₱) <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative mt-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 dark:text-slate-500 text-xs">₱</span>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={empFormSalary}
                                            onChange={(e) => setEmpFormSalary(e.target.value)}
                                            required
                                            placeholder="0.00"
                                            className="h-10 pl-7 font-mono font-bold text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-[#8DB600]"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Container Multiplier <span className="text-rose-500">*</span>
                                    </Label>
                                    <Select
                                        value={empFormMultiplier}
                                        onChange={(e) => setEmpFormMultiplier(e.target.value)}
                                        required
                                        className="h-10 mt-1 w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 px-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 outline-none cursor-pointer focus:border-[#8DB600]"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-slate-900">Select Multiplier...</option>
                                        <option value="1" className="bg-white dark:bg-slate-900">x1 (₱1.00 / jug)</option>
                                        <option value="2" className="bg-white dark:bg-slate-900">x2 (₱2.00 / jug)</option>
                                        <option value="3" className="bg-white dark:bg-slate-900">x3 (₱3.00 / jug)</option>
                                        <option value="4" className="bg-white dark:bg-slate-900">x4 (₱4.00 / jug)</option>
                                        <option value="5" className="bg-white dark:bg-slate-900">x5 (₱5.00 / jug)</option>
                                    </Select>
                                </div>
                            )}

                            <div className="flex items-end justify-end">
                                <Button
                                    type="submit"
                                    disabled={isPending || !empFormName.trim()}
                                    className="w-full sm:w-auto h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                >
                                    {editingEmpId ? <Check className="w-4 h-4 stroke-[2.5]" /> : <Plus className="w-4 h-4 stroke-[2.5]" />}
                                    <span>{isPending ? 'Saving...' : (editingEmpId ? 'Update Employee' : 'Add Employee')}</span>
                                </Button>
                            </div>
                        </div>
                    </form>

                    {/* Employee Directory Table */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Registered Employees ({employees?.length || 0})
                            </span>
                        </div>

                        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xs">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200/80 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                                <tr>
                                    <th className="px-4 py-3">Employee Name</th>
                                    <th className="px-4 py-3">Salary Structure</th>
                                    <th className="px-4 py-3 text-right">Actions</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 bg-white dark:bg-slate-900">
                                {isEmpLoading ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                            Loading employees...
                                        </td>
                                    </tr>
                                ) : employees?.length === 0 ? (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-slate-400 dark:text-slate-500">
                                            No employees found. Register staff members using the form above.
                                        </td>
                                    </tr>
                                ) : (
                                    employees?.map((emp) => {
                                        const isEditing = editingEmpId === emp.id;
                                        return (
                                            <tr
                                                key={emp.id}
                                                className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                                                    isEditing ? 'bg-lime-50/50 dark:bg-lime-950/25' : ''
                                                }`}
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-[11px] flex items-center justify-center shrink-0">
                                                            {getInitials(emp.name)}
                                                        </div>
                                                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                                            {emp.name}
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3">
                                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-lime-50 dark:bg-lime-950/40 text-[#5f7d00] dark:text-lime-400 border border-lime-200 dark:border-lime-900/50">
                                                        <Banknote className="w-3.5 h-3.5 text-[#8DB600] dark:text-lime-400" />
                                                        <span>
                                                                {emp.salary_type === 'per_container'
                                                                    ? `Per Container (x${emp.container_multiplier || 1})`
                                                                    : `${currency(emp.default_salary || 0, { symbol: '₱' }).format()} / day`}
                                                            </span>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEditClick(emp)}
                                                            className="w-7 h-7 flex items-center justify-center text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                            title="Edit Profile"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeleteEmployee(emp.id)}
                                                            className="w-7 h-7 flex items-center justify-center text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors cursor-pointer"
                                                            title="Delete Profile"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end">
                    <Button
                        type="button"
                        onClick={handleClose}
                        variant="outline"
                        className="h-10 px-6 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer shadow-2xs"
                    >
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}