// src/pages/activity-logs.jsx
import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useStore } from '../store/useStore';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { Card, CardContent, Button } from '../components/ui';
import { ShieldAlert, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

import ActivityLogsHeader from '../components/activity-logs/ActivityLogsHeader';
import ActivityLogsFilters from '../components/activity-logs/ActivityLogsFilters';
import ActivityLogsTable from '../components/activity-logs/ActivityLogsTable';
import ActivityLogsTour from '../components/activity-logs/ActivityLogsTour';

export default function ActivityLogsPage() {
    const user = useStore((s) => s.user);
    const sessionLoaded = useStore((s) => s.sessionLoaded);

    // Safe multi-field admin check (handles both boolean flags and string/object roles)
    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (
            user.id === 1 ||
            user.isAdmin ||
            user.isadmin ||
            user.is_admin ||
            user.isSuperAdmin ||
            user.role_id === 1 ||
            user.roleId === 1
        ) {
            return true;
        }
        const role = String(
            user.role?.name || user.role || user.position || user.user_type || ''
        )
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager'].some((k) =>
            role.includes(k)
        );
    }, [user]);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState('ALL');
    const [filterType, setFilterType] = useState('ALL');
    const [page, setPage] = useState(1);

    // Fetch 20 logs per page based on current page and filters
    const { data, isLoading } = useActivityLogs({
        page,
        pageSize: 20,
        searchTerm,
        filterAction,
        filterType
    });

    const logs = data?.logs || [];
    const totalPages = Math.max(1, data?.totalPages || 1);
    const totalCount = data?.totalCount ?? logs.length;

    // Reset page to 1 whenever a filter changes
    const handleSearchChange = (val) => {
        setSearchTerm(val);
        setPage(1);
    };
    const handleActionChange = (val) => {
        setFilterAction(val);
        setPage(1);
    };
    const handleTypeChange = (val) => {
        setFilterType(val);
        setPage(1);
    };

    if (!sessionLoaded) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] text-slate-400 text-xs sm:text-sm font-medium">
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-[#8DB600] mr-2" />
                <span>Verifying authorization...</span>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <ShieldAlert className="w-14 h-14 sm:w-16 sm:h-16 text-rose-500 mb-3" />
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Access Denied</h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                    You must be an administrator to view the system activity logs.
                </p>
            </div>
        );
    }

    return (
        <div className="activity-logs-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-5 md:p-6 space-y-2.5 sm:space-y-6 pb-24 md:pb-8 transition-colors dark:[color-scheme:dark]">
            <Head>
                <title>Activity Logs | Seaside POS</title>
            </Head>

            {/* Match POS and all management pages edge-to-edge .container fit on mobile (< 640px) & prevent search icon overlap */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.activity-logs-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.activity-logs-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
                .activity-logs-page input[type="text"],
                .activity-logs-page input[placeholder*="Search"] {
                    padding-left: 2.35rem !important;
                }
            `}</style>

            <div id="tour-al-header" className="px-0.5 sm:px-0">
                <ActivityLogsHeader />
            </div>

            <Card className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div id="tour-al-filters">
                    <ActivityLogsFilters
                        searchTerm={searchTerm}
                        setSearchTerm={handleSearchChange}
                        filterAction={filterAction}
                        setFilterAction={handleActionChange}
                        filterType={filterType}
                        setFilterType={handleTypeChange}
                    />
                </div>

                <CardContent id="tour-al-table" className="p-0">
                    <ActivityLogsTable logs={logs} isLoading={isLoading} />
                </CardContent>

                {/* Pagination Controls */}
                <div
                    id="tour-al-pagination"
                    className="flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 px-3 py-2.5 sm:p-4 bg-slate-50/90 dark:bg-slate-800/70"
                >
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isLoading}
                        className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs font-bold cursor-pointer disabled:opacity-40"
                    >
                        <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Prev</span>
                    </Button>

                    <div className="flex flex-col items-center text-center">
                        <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                            Page {page} of {totalPages}
                        </span>
                        {totalCount > 0 && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                {totalCount.toLocaleString()} {totalCount === 1 ? 'entry' : 'entries'}
                            </span>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || isLoading}
                        className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 flex items-center gap-1 text-xs font-bold cursor-pointer disabled:opacity-40"
                    >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                </div>
            </Card>

            <ActivityLogsTour isLogsLoading={isLoading} />
        </div>
    );
}