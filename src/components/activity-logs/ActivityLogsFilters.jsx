// src/components/activity-logs/ActivityLogsFilters.jsx
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
                    <option value="SCAN">Scan List / Barcode Scans</option>
                    <option value="CREATE">Creates / Adds</option>
                    <option value="UPDATE">Updates / Edits / Settlements</option>
                    <option value="DELETE">Deletes / Voids</option>
                    <option value="APPROVE_UTANG">Utang Approvals</option>
                    <option value="LOGIN">Logins / Shifts</option>
                </Select>
                <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10">
                    <option value="ALL">All Modules</option>
                    <option value="SCAN_LIST">POS Scan List</option>
                    <option value="SALE">Sales</option>
                    <option value="INVENTORY">Inventory &amp; Stock</option>
                    <option value="MAINTENANCE">Maintenance &amp; Water Tests</option>
                    <option value="EXPENSE">Expenses</option>
                    <option value="PRODUCT">Products</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="CUSTOMER_CREDIT">Customer Utang</option>
                    <option value="DEBT">Debts</option>
                    <option value="SALARY">Salary</option>
                    <option value="EMPLOYEE">Employees</option>
                    <option value="USER">Staff &amp; Approvals</option>
                    <option value="NOTE">Dashboard Notes</option>
                    <option value="SCANNED_LOG">Scanned Sheets Archive</option>
                    <option value="AUTH">Logins &amp; Shifts</option>
                    <option value="SYSTEM">System Settings</option>
                </Select>
            </div>
        </div>
    );
}