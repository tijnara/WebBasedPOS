import React from 'react';
import currency from 'currency.js';
import {
    Button, Input, Label, Select,
    Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '../ui';
import { Edit2, Trash2 } from 'lucide-react';

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
                                                    employees,
                                                    handleEditClick,
                                                    handleDeleteEmployee
                                                }) {
    return (
        <Dialog open={isManageModalOpen} onOpenChange={setIsManageModalOpen}>
            <DialogContent className="max-w-2xl w-full">
                <DialogHeader>
                    <DialogTitle>Manage Employees</DialogTitle>
                </DialogHeader>
                <div className="p-4 space-y-6">
                    <form onSubmit={handleSaveEmployee} className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><Label>Employee Name</Label><Input value={empFormName} onChange={e => setEmpFormName(e.target.value)} required /></div>
                            <div>
                                <Label>Salary Type</Label>
                                <Select value={empFormSalaryType} onChange={e => setEmpFormSalaryType(e.target.value)} required>
                                    <option value="per_day">Per Day</option>
                                    <option value="per_container">Per Container</option>
                                </Select>
                            </div>
                            {empFormSalaryType === 'per_day' ? (
                                <div><Label>Daily Wage Rate (₱)</Label><Input type="number" step="0.01" value={empFormSalary} onChange={e => setEmpFormSalary(e.target.value)} /></div>
                            ) : (
                                <div>
                                    <Label>Container Multiplier</Label>
                                    <Select value={empFormMultiplier} onChange={e => setEmpFormMultiplier(e.target.value)} required>
                                        <option value="" disabled>Select Multiplier...</option>
                                        <option value="1">x1</option>
                                        <option value="2">x2</option>
                                        <option value="3">x3</option>
                                        <option value="4">x4</option>
                                        <option value="5">x5</option>
                                    </Select>
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end gap-2">
                            {editingEmpId && (
                                <Button type="button" variant="ghost" onClick={() => {
                                    setEditingEmpId(null);
                                    setEmpFormName('');
                                    setEmpFormSalary('');
                                    setEmpFormSalaryType('per_day');
                                    setEmpFormMultiplier('');
                                }}>Cancel</Button>
                            )}
                            <Button type="submit" disabled={isPending}>{editingEmpId ? 'Update' : 'Add Employee'}</Button>
                        </div>
                    </form>
                    <div className="max-h-80 overflow-y-auto border rounded-lg">
                        <Table>
                            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Salary Info</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {isEmpLoading ? <TableRow><TableCell colSpan="3" className="text-center">Loading...</TableCell></TableRow> :
                                    employees?.map(emp => (
                                        <TableRow key={emp.id}>
                                            <TableCell className="font-medium">{emp.name}</TableCell>
                                            <TableCell>
                                                {emp.salary_type === 'per_container'
                                                    ? `Per Container (x${emp.container_multiplier})`
                                                    : currency(emp.default_salary, { symbol: '₱' }).format() + ' / day'}
                                            </TableCell>
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
    );
}