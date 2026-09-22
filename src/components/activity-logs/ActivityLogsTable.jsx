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
    return (
        <div className="overflow-x-auto w-full">
            <Table className="w-full min-w-[800px]">
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
                    {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">Loading logs...</TableCell></TableRow>
                    ) : logs.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-10 text-gray-500">No activity logs match your filters.</TableCell></TableRow>
                    ) : (
                        logs.map((log) => (
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
                                <TableCell className="text-sm text-gray-700 dark:text-gray-300">
                                    {log.description}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}