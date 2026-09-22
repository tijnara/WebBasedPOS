import React from 'react';
import { Search } from 'lucide-react';
import { Input, Select } from '../ui';

export default function ActivityLogsFilters({
                                                searchTerm, setSearchTerm,
                                                filterAction, setFilterAction,
                                                filterType, setFilterType
                                            }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search users or descriptions..."
                        className="pl-9 h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-10">
                    <option value="ALL">All Actions</option>
                    <option value="CREATE">Creates / Adds</option>
                    <option value="UPDATE">Updates / Edits</option>
                    <option value="DELETE">Deletes</option>
                    <option value="LOGIN">Logins / Shifts</option>
                </Select>
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10">
                    <option value="ALL">All Modules</option>
                    <option value="SALE">Sales</option>
                    <option value="EXPENSE">Expenses</option>
                    <option value="PRODUCT">Products</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="EMPLOYEE">Employees & Salary</option>
                    <option value="SYSTEM">System Settings</option>
                </Select>
            </div>
        </div>
    );
}