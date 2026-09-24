import React from 'react';
import { format, parseISO } from 'date-fns';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../ui';

const actionColors = {
    'CREATE': 'text-green-600 bg-green-50 dark:bg-green-900/20',
    'UPDATE': 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    'DELETE': 'text-red-600 bg-red-50 dark:bg-red-900/20',
    'LOGIN': 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    'DEFAULT': 'text-gray-600 bg-gray-50 dark:bg-gray-800'
};

export default function ActivityLogsTable({ logs, isLoading }) {
    if (isLoading) {
        return <div className="text-center py-10 text-gray-500">Loading logs...</div>;
    }

    if (logs.length === 0) {
        return <div className="text-center py-10 text-gray-500">No activity logs match your filters.</div>;
    }

    return (
        <div className="w-full">
            {/* --- DESKTOP VIEW --- */}
            <div className="hidden md:block w-full min-w-0">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow className="bg-gray-50/50 dark:bg-gray-800/30">
                            <TableHead className="w-48">Date & Time</TableHead>
                            <TableHead className="w-48">User</TableHead>
                            <TableHead className="w-32">Action</TableHead>
                            <TableHead className="w-32">Module</TableHead>
                            <TableHead>Details</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {logs.map((log) => (
                            <TableRow key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                                    {format(parseISO(log.created_at), 'MMM dd, yyyy - h:mm:ss a')}
                                </TableCell>
                                <TableCell>
                                    <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">{log.user_name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">{log.user_role}</div>
                                </TableCell>
                                <TableCell>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider ${actionColors[log.action] || actionColors['DEFAULT']}`}>
                                        {log.action}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                        {log.entity_type}
                                    </span>
                                </TableCell>
                                <TableCell className="text-sm text-gray-700 dark:text-gray-300 whitespace-normal break-words">
                                    {log.description}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* --- MOBILE VIEW (Stacked Cards) --- */}
            <div className="block md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {logs.map((log) => (
                    <div key={log.id} className="p-4 bg-white dark:bg-gray-900">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">{log.user_name}</div>
                                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{log.user_role}</div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md tracking-wider ${actionColors[log.action] || actionColors['DEFAULT']}`}>
                                {log.action}
                            </span>
                        </div>

                        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                            {log.description}
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-gray-50 dark:border-gray-800 pt-2">
                            <span className="font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                                {log.entity_type}
                            </span>
                            <span className="text-gray-500">
                                {format(parseISO(log.created_at), 'MMM dd, yyyy - h:mm a')}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}