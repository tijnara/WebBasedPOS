// C:\Users\tijna\WebstormProjects\WebBasedPOS\src\pages\activity-logs.jsx
import React, { useState } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { Card, CardContent, Button } from '../components/ui';
import { ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

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
    const [page, setPage] = useState(1);

    // Fetch exactly 20 logs based on current page and filters
    const { data, isLoading } = useActivityLogs({
        page,
        pageSize: 20,
        searchTerm,
        filterAction,
        filterType
    });

    const logs = data?.logs || [];
    const totalPages = data?.totalPages || 1;

    // Reset page to 1 whenever a filter changes
    const handleSearchChange = (val) => { setSearchTerm(val); setPage(1); };
    const handleActionChange = (val) => { setFilterAction(val); setPage(1); };
    const handleTypeChange = (val) => { setFilterType(val); setPage(1); };

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
        <div className="p-4 md:p-6 space-y-4 md:space-y-6 responsive-page max-w-7xl mx-auto">
            <Head>
                <title>Activity Logs | Seaside POS</title>
            </Head>

            <ActivityLogsHeader />

            <Card className="shadow-sm overflow-hidden flex flex-col">
                <ActivityLogsFilters
                    searchTerm={searchTerm} setSearchTerm={handleSearchChange}
                    filterAction={filterAction} setFilterAction={handleActionChange}
                    filterType={filterType} setFilterType={handleTypeChange}
                />

                <CardContent className="p-0">
                    <ActivityLogsTable logs={logs} isLoading={isLoading} />
                </CardContent>

                {/* Pagination Controls */}
                <div className="flex items-center justify-between border-t border-gray-100 p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="flex items-center gap-1 text-sm font-medium"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </Button>
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                            Page {page} of {totalPages}
                        </span>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="flex items-center gap-1 text-sm font-medium"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </Card>
        </div>
    );
}