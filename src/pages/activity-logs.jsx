// C:\Users\tijna\WebstormProjects\WebBasedPOS\src\pages\activity-logs.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { Card, CardContent } from '../components/ui';
import { ShieldAlert } from 'lucide-react';

import ActivityLogsHeader from '../components/activity-logs/ActivityLogsHeader';
import ActivityLogsFilters from '../components/activity-logs/ActivityLogsFilters';
import ActivityLogsTable from '../components/activity-logs/ActivityLogsTable';

export default function ActivityLogsPage() {
    const { user } = useStore();

    // Check for admin privileges using both role and the isadmin boolean from your schema
    const isAdmin = user?.role?.toLowerCase() === 'admin' || user?.isadmin === true;

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');

    // Fetch the 500 most recent logs
    const { data: logs = [], isLoading } = useActivityLogs(500);

    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            const matchesSearch = log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user_name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesAction = filterAction === 'ALL' || log.action === filterAction;
            const matchesType = filterType === 'ALL' || log.entity_type === filterType;
            return matchesSearch && matchesAction && matchesType;
        });
    }, [logs, searchTerm, filterAction, filterType]);

    // If the user is not an admin, render the Access Denied screen
    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Access Denied</h1>
                <p className="text-gray-500 mt-2">You must be an administrator to view the system activity logs.</p>
            </div>
        );
    }

    // If the user is an admin, render the actual activity logs dashboard
    return (
        <div className="p-6 space-y-6 responsive-page max-w-7xl mx-auto">
            <Head>
                <title>Activity Logs | Seaside POS</title>
            </Head>

            <ActivityLogsHeader />

            <Card className="shadow-sm overflow-hidden">
                <ActivityLogsFilters
                    searchTerm={searchTerm} setSearchTerm={setSearchTerm}
                    filterAction={filterAction} setFilterAction={setFilterAction}
                    filterType={filterType} setFilterType={setFilterType}
                />

                <CardContent className="p-0">
                    <ActivityLogsTable logs={filteredLogs} isLoading={isLoading} />
                </CardContent>
            </Card>
        </div>
    );
}