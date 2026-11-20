// src/components/dashboard/RefillGameAnalyticsPage.jsx
import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Gamepad2,
    Trophy,
    Users,
    Droplets,
    Sparkles,
    Search,
    Filter,
    RefreshCw,
    Trash2,
    ExternalLink,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Award,
    Flame,
    X
} from 'lucide-react';
import {
    useRefillGameDashboardData,
    useResetRefillGameData
} from '../../hooks/useRefillGame';
import { useStore } from '../../store/useStore';

function formatManilaDateTime(isoString) {
    if (!isoString) return '—';
    try {
        return new Intl.DateTimeFormat('en-PH', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(new Date(isoString));
    } catch {
        return isoString;
    }
}

function getManilaTodayString() {
    try {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    } catch {
        return '';
    }
}

function getManilaDaysAgoString(days) {
    try {
        const d = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'Asia/Manila',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(d);
    } catch {
        return '';
    }
}

export default function RefillGameAnalyticsPage() {
    const user = useStore((s) => s.user);
    const addToast = useStore((s) => s.addToast);

    const isAdmin = useMemo(() => {
        if (!user) return false;
        if (user.isAdmin || user.isadmin || user.is_admin || user.isSuperAdmin) return true;
        const role = String(
            user.role?.name || user.role || user.position || user.user_type || ''
        )
            .toLowerCase()
            .trim();
        return ['admin', 'administrator', 'owner', 'superadmin', 'manager'].some((k) =>
            role.includes(k)
        );
    }, [user]);

    // Filter states
    const [activeTab, setActiveTab] = useState('leaderboard'); // 'leaderboard' | 'logs'
    const [searchQuery, setSearchQuery] = useState('');
    const [playerTypeFilter, setPlayerTypeFilter] = useState('all'); // 'all' | 'guest' | 'staff'
    const [jugFilter, setJugFilter] = useState('all'); // 'all' | 'round' | 'slim'
    const [gradeFilter, setGradeFilter] = useState('all'); // 'all' | 'PERFECT SEAL' | 'GOOD FILL' | 'UNDERFILLED' | 'OVERFLOW'
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement?.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const preventEnterReload = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    const { data, isLoading, isFetching, refetch } = useRefillGameDashboardData({
        dateFrom,
        dateTo
    });
    const resetGameData = useResetRefillGameData();

    const summary = data?.summary || {
        totalPlayers: 0,
        guestPlayersCount: 0,
        staffPlayersCount: 0,
        totalAttempts: 0,
        perfectCount: 0,
        goodCount: 0,
        underfilledCount: 0,
        overflowCount: 0,
        perfectRate: 0,
        roundCount: 0,
        slimCount: 0,
        avgLiters: 0,
        highestScore: 0,
        topStreak: 0
    };

    // Filtered Leaderboard Players
    const filteredPlayers = useMemo(() => {
        const list = data?.players || [];
        return list.filter((p) => {
            if (playerTypeFilter === 'guest' && !p.is_guest) return false;
            if (playerTypeFilter === 'staff' && p.is_guest) return false;
            if (jugFilter !== 'all' && p.last_jug_type !== jugFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = String(p.player_name || '').toLowerCase().includes(q);
                const matchKey = String(p.player_key || '').toLowerCase().includes(q);
                if (!matchName && !matchKey) return false;
            }
            return true;
        });
    }, [data?.players, playerTypeFilter, jugFilter, searchQuery]);

    // Filtered Refill Logs
    const filteredLogs = useMemo(() => {
        const list = data?.logs || [];
        return list.filter((l) => {
            if (playerTypeFilter === 'guest' && !l.is_guest) return false;
            if (playerTypeFilter === 'staff' && l.is_guest) return false;
            if (jugFilter !== 'all' && l.jug_type !== jugFilter) return false;
            if (gradeFilter !== 'all' && l.grade !== gradeFilter) return false;
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                if (!String(l.player_name || '').toLowerCase().includes(q)) return false;
            }
            return true;
        });
    }, [data?.logs, playerTypeFilter, jugFilter, gradeFilter, searchQuery]);

    const handleResetAll = async () => {
        if (!isAdmin || user?.isDemo) return;
        const confirmed = window.confirm(
            'Reset all Refill Simulator leaderboard scores and attempt logs? This cannot be undone.'
        );
        if (!confirmed) return;

        try {
            await resetGameData.mutateAsync();
            addToast?.({
                title: 'Simulator Data Cleared',
                description: 'All player scores and refill logs have been reset.',
                variant: 'success'
            });
        } catch (err) {
            addToast?.({
                title: 'Reset Failed',
                description: err.message || 'Could not reset simulator data.',
                variant: 'destructive'
            });
        }
    };

    const roundPct =
        summary.totalAttempts > 0
            ? Math.round((summary.roundCount / summary.totalAttempts) * 100)
            : 50;
    const slimPct = 100 - roundPct;

    const todayStr = getManilaTodayString();
    const sevenDaysAgoStr = getManilaDaysAgoString(7);
    const isTodayActive = dateFrom === todayStr && dateTo === todayStr;
    const isLast7Active = dateFrom === sevenDaysAgoStr && dateTo === todayStr;

    const renderGradeBadge = (grade) => {
        if (grade === 'PERFECT SEAL') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-lime-100 dark:bg-lime-950/70 text-[#5f7d00] dark:text-lime-400">
                    <CheckCircle2 className="w-3 h-3" />
                    PERFECT SEAL
                </span>
            );
        }
        if (grade === 'GOOD FILL') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300">
                    GOOD FILL
                </span>
            );
        }
        if (grade === 'UNDERFILLED') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300">
                    UNDERFILLED
                </span>
            );
        }
        if (grade === 'OVERFLOW') {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-400">
                    <AlertTriangle className="w-3 h-3" />
                    OVERFLOW
                </span>
            );
        }
        return null;
    };

    return (
        <div className="refill-game-page w-full space-y-2.5 sm:space-y-6 px-1.5 py-2 sm:px-0 sm:py-4 md:py-6 pb-24 md:pb-8 dark:[color-scheme:dark]">
            {/* Match POS, Expenses, Dashboard, Report, History, Scanned Logs, Customer, Maintenance, Product, 3D Icons, Inventory, Gallery, Salary & Debt edge-to-edge fit on mobile (< 640px) */}
            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.refill-game-page) .container,
                    .app:has(.refill-game-page) .responsive-page {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.refill-game-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

            {/* Page Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 bg-white dark:bg-slate-900 p-3 sm:p-6 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs">
                <div className="flex items-start sm:items-center gap-3 sm:gap-3.5">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-[#8DB600] to-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-lime-600/20">
                        <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <h1 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                3D Refill Simulator Analytics
                            </h1>
                            <span className="text-[9.5px] sm:text-[10px] font-black uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full bg-lime-100 dark:bg-lime-950/70 text-[#5f7d00] dark:text-lime-400 border border-lime-300/60 dark:border-lime-800/50">
                                Guest &amp; Staff Engagement
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Monitor landing-page visitor engagement, auto-generated guest profiles, container preferences, and precision refill logs.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
                    <button
                        type="button"
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="w-full lg:w-auto h-9 sm:h-10 inline-flex items-center justify-center gap-1.5 px-3 sm:px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isFetching ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>

                    <Link
                        href="/about"
                        target="_blank"
                        className="w-full lg:w-auto h-9 sm:h-10 inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-extrabold shadow-xs transition-all"
                    >
                        <span className="truncate">Open Simulator</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </Link>

                    {isAdmin && (
                        <button
                            type="button"
                            onClick={handleResetAll}
                            disabled={resetGameData.isPending || user?.isDemo}
                            className="col-span-2 lg:col-span-1 w-full lg:w-auto h-9 sm:h-10 inline-flex items-center justify-center gap-1.5 px-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                        >
                            <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            <span>Reset Data</span>
                        </button>
                    )}
                </div>
            </div>

            {/* 4 KPI Summary Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-4">
                {/* KPI 1: Total Players */}
                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                            Total Players
                        </span>
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                        <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary.totalPlayers}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-bold">
                                {summary.guestPlayersCount} {summary.guestPlayersCount === 1 ? 'Guest' : 'Guests'}
                            </span>
                            <span className="px-1.5 sm:px-2 py-0.5 rounded-md bg-lime-500/10 text-[#5f7d00] dark:text-lime-400 font-bold">
                                {summary.staffPlayersCount} Staff
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI 2: Refill Sessions & Precision */}
                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                            Refills Simulated
                        </span>
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-lime-50 dark:bg-lime-950/60 text-[#659000] dark:text-lime-400 flex items-center justify-center shrink-0">
                            <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                        <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                            {summary.totalAttempts}
                        </div>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span className="text-[#659000] dark:text-lime-400 font-bold">
                                {summary.perfectRate}% Perfect
                            </span>
                            <span>•</span>
                            <span>Avg {summary.avgLiters.toFixed(2)} L</span>
                        </div>
                    </div>
                </div>

                {/* KPI 3: Top High Score & Streak */}
                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                            High Score
                        </span>
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-3">
                        <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums truncate">
                            {summary.highestScore.toLocaleString()}{' '}
                            <span className="text-xs sm:text-sm font-bold text-slate-400">pts</span>
                        </div>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] sm:text-[11px] font-bold text-amber-600 dark:text-amber-400 truncate">
                            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            <span className="truncate">Best Streak: {summary.topStreak}x</span>
                        </div>
                    </div>
                </div>

                {/* KPI 4: Container Type Preference */}
                <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col justify-between min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
                            Container Choice
                        </span>
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                    </div>
                    <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                        <div className="flex justify-between text-[10.5px] sm:text-xs font-bold gap-1">
                            <span className="text-sky-600 dark:text-sky-400 truncate">
                                Round ({summary.roundCount})
                            </span>
                            <span className="text-blue-600 dark:text-blue-400 truncate">
                                Slim ({summary.slimCount})
                            </span>
                        </div>
                        <div className="w-full h-2 sm:h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                            <div
                                className="h-full bg-sky-400 transition-all duration-300"
                                style={{ width: `${roundPct}%` }}
                            />
                            <div
                                className="h-full bg-blue-600 transition-all duration-300"
                                style={{ width: `${slimPct}%` }}
                            />
                        </div>
                        <div className="text-[9.5px] sm:text-[10px] font-semibold text-slate-400 truncate">
                            {roundPct}% Round vs {slimPct}% Slim
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters & View Switcher Card */}
            <div className="bg-white dark:bg-slate-900 p-2.5 sm:p-5 rounded-xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-2.5 sm:space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
                    {/* View Tabs: Leaderboard vs Refill Logs */}
                    <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl sm:rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full md:w-max">
                        <button
                            type="button"
                            onClick={() => setActiveTab('leaderboard')}
                            className={`flex-1 md:flex-initial px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeTab === 'leaderboard'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-lime-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Trophy className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Leaderboard ({filteredPlayers.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('logs')}
                            className={`flex-1 md:flex-initial px-2.5 sm:px-4 py-2 rounded-lg sm:rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                activeTab === 'logs'
                                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-lime-400 shadow-2xs'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                        >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Attempt Logs ({filteredLogs.length})</span>
                        </button>
                    </div>

                    {/* Quick Manila Date Presets */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                        <span className="text-slate-400 mr-0.5 hidden sm:inline">Date (Manila):</span>
                        <button
                            type="button"
                            onClick={() => {
                                setDateFrom('');
                                setDateTo('');
                            }}
                            className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                                !dateFrom && !dateTo
                                    ? 'bg-[#8DB600] text-white border-[#8DB600]'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            All Time
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDateFrom(todayStr);
                                setDateTo(todayStr);
                            }}
                            className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                                isTodayActive
                                    ? 'bg-[#8DB600] text-white border-[#8DB600]'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setDateFrom(sevenDaysAgoStr);
                                setDateTo(todayStr);
                            }}
                            className={`px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${
                                isLast7Active
                                    ? 'bg-[#8DB600] text-white border-[#8DB600]'
                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#8DB600]'
                            }`}
                        >
                            Last 7 Days
                        </button>
                    </div>
                </div>

                {/* Search & Dropdown Filters */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-2 sm:gap-3">
                    <div className="relative col-span-2 lg:col-span-2">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={preventEnterReload}
                            placeholder="Search guest alias or staff... (/)"
                            className="w-full h-9 sm:h-10 pl-9 pr-8 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 outline-none focus:border-[#8DB600]"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                aria-label="Clear search"
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    <div className="relative col-span-1">
                        <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <select
                            value={playerTypeFilter}
                            onChange={(e) => setPlayerTypeFilter(e.target.value)}
                            className="w-full h-9 sm:h-10 pl-8 pr-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8DB600] cursor-pointer"
                        >
                            <option value="all" className="bg-white dark:bg-slate-900">All Players</option>
                            <option value="guest" className="bg-white dark:bg-slate-900">Guests Only</option>
                            <option value="staff" className="bg-white dark:bg-slate-900">Staff Only</option>
                        </select>
                    </div>

                    <div className="col-span-1">
                        <select
                            value={jugFilter}
                            onChange={(e) => setJugFilter(e.target.value)}
                            className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8DB600] cursor-pointer"
                        >
                            <option value="all" className="bg-white dark:bg-slate-900">All Containers</option>
                            <option value="round" className="bg-white dark:bg-slate-900">Round 20L Carboy</option>
                            <option value="slim" className="bg-white dark:bg-slate-900">Slim w/ Faucet</option>
                        </select>
                    </div>

                    {activeTab === 'logs' && (
                        <div className="col-span-2 lg:col-span-1">
                            <select
                                value={gradeFilter}
                                onChange={(e) => setGradeFilter(e.target.value)}
                                className="w-full h-9 sm:h-10 px-2.5 sm:px-3 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8DB600] cursor-pointer"
                            >
                                <option value="all" className="bg-white dark:bg-slate-900">All Seal Grades</option>
                                <option value="PERFECT SEAL" className="bg-white dark:bg-slate-900">Perfect Seal</option>
                                <option value="GOOD FILL" className="bg-white dark:bg-slate-900">Good Fill</option>
                                <option value="UNDERFILLED" className="bg-white dark:bg-slate-900">Underfilled</option>
                                <option value="OVERFLOW" className="bg-white dark:bg-slate-900">Overflow</option>
                            </select>
                        </div>
                    )}

                    <div className={`col-span-2 ${activeTab === 'logs' ? 'lg:col-span-1' : 'lg:col-span-2'} grid grid-cols-2 gap-1.5 sm:gap-2`}>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            aria-label="Date from"
                            title="From date (Asia/Manila)"
                            className="w-full h-9 sm:h-10 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8DB600]"
                        />
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            aria-label="Date to"
                            title="To date (Asia/Manila)"
                            className="w-full h-9 sm:h-10 px-2 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-[#8DB600]"
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Card List Views (< 768px) */}
            <div className="block md:hidden space-y-2">
                {isLoading ? (
                    <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        Loading simulator records...
                    </div>
                ) : activeTab === 'leaderboard' ? (
                    filteredPlayers.length === 0 ? (
                        <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                            No player records found matching your filters.
                        </div>
                    ) : (
                        filteredPlayers.map((player, idx) => (
                            <div
                                key={player.id || player.player_key}
                                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="font-mono font-black shrink-0">
                                            {idx === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                                                    <Award className="w-3.5 h-3.5" /> #1
                                                </span>
                                            ) : idx === 1 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                                                    #2
                                                </span>
                                            ) : idx === 2 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                                                    #3
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400 px-1">#{idx + 1}</span>
                                            )}
                                        </span>
                                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                            {player.player_name}
                                        </span>
                                        <span
                                            className={`text-[9.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full shrink-0 ${
                                                player.is_guest
                                                    ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/50'
                                                    : 'bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200/80 dark:border-lime-800/50'
                                            }`}
                                        >
                                            {player.is_guest ? 'Guest' : 'Staff'}
                                        </span>
                                    </div>

                                    <span className="font-mono font-black text-sm text-[#659000] dark:text-lime-400 shrink-0">
                                        {Number(player.total_score || 0).toLocaleString()} pts
                                    </span>
                                </div>

                                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                                    <div>
                                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Jugs</span>
                                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{player.jugs_completed || 0}</span>
                                    </div>
                                    <div>
                                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Perfect</span>
                                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{player.perfect_seals || 0}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[9.5px] text-slate-400 uppercase font-bold block">Best Streak</span>
                                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{player.best_streak || 0}x</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1">
                                    <span className="font-semibold text-slate-500 dark:text-slate-400">
                                        {player.last_jug_type === 'slim' ? 'Slim w/ Faucet' : 'Round 20L'}
                                    </span>
                                    <span>{formatManilaDateTime(player.updated_at)}</span>
                                </div>
                            </div>
                        ))
                    )
                ) : filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-xs font-semibold text-slate-400 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        No refill simulation logs found matching your filters.
                    </div>
                ) : (
                    filteredLogs.map((log) => (
                        <div
                            key={log.id}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2"
                        >
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                        {log.player_name}
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                                        {log.is_guest ? 'Guest' : 'Staff'}
                                    </span>
                                </div>

                                <span className="font-mono font-black text-sm text-[#659000] dark:text-lime-400 shrink-0">
                                    +{log.points_earned || 0} pts
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                {renderGradeBadge(log.grade)}
                                <div className="flex items-center gap-2 text-xs font-mono font-bold">
                                    <span className="text-slate-800 dark:text-slate-200">
                                        {Number(log.liters_filled || 0).toFixed(2)} L
                                    </span>
                                    {log.streak_count > 0 && (
                                        <span className="text-amber-600 dark:text-amber-400">
                                            {log.streak_count}x
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                                <span className="font-semibold text-slate-500 dark:text-slate-400">
                                    {log.jug_type === 'slim' ? 'Slim w/ Faucet' : 'Round 20L'}
                                </span>
                                <span>{formatManilaDateTime(log.created_at)}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Data Table Container (>= 768px) */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-sm font-semibold text-slate-400">
                        Loading simulator records...
                    </div>
                ) : activeTab === 'leaderboard' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="py-3.5 px-4">Rank</th>
                                <th className="py-3.5 px-4">Player / Guest Alias</th>
                                <th className="py-3.5 px-4">Type</th>
                                <th className="py-3.5 px-4 text-right">Total Score</th>
                                <th className="py-3.5 px-4 text-right">Jugs Filled</th>
                                <th className="py-3.5 px-4 text-right">Perfect Seals</th>
                                <th className="py-3.5 px-4 text-right">Best Streak</th>
                                <th className="py-3.5 px-4">Last Container</th>
                                <th className="py-3.5 px-4">Last Played (Manila)</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                            {filteredPlayers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={9}
                                        className="py-12 text-center text-slate-400 text-xs font-semibold"
                                    >
                                        No player records found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredPlayers.map((player, idx) => (
                                    <tr
                                        key={player.id || player.player_key}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="py-3.5 px-4 font-mono font-black">
                                            {idx === 0 ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">
                                                    <Award className="w-3.5 h-3.5" /> #1
                                                </span>
                                            ) : idx === 1 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs">
                                                    #2
                                                </span>
                                            ) : idx === 2 ? (
                                                <span className="px-2 py-0.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 text-xs">
                                                    #3
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">#{idx + 1}</span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                                            {player.player_name}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <span
                                                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    player.is_guest
                                                        ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/80 dark:border-cyan-800/50'
                                                        : 'bg-lime-50 dark:bg-lime-950/60 text-[#5f7d00] dark:text-lime-400 border border-lime-200/80 dark:border-lime-800/50'
                                                }`}
                                            >
                                                {player.is_guest ? 'Guest' : 'Staff'}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#659000] dark:text-lime-400">
                                            {Number(player.total_score || 0).toLocaleString()} pts
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                                            {player.jugs_completed || 0}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {player.perfect_seals || 0}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                            {player.best_streak || 0}x
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-bold text-slate-600 dark:text-slate-300">
                                            {player.last_jug_type === 'slim'
                                                ? 'Slim w/ Faucet'
                                                : 'Round 20L'}
                                        </td>
                                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatManilaDateTime(player.updated_at)}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="bg-slate-50/90 dark:bg-slate-950/60 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                <th className="py-3.5 px-4">Date &amp; Time (Manila)</th>
                                <th className="py-3.5 px-4">Player / Guest</th>
                                <th className="py-3.5 px-4">3D Container</th>
                                <th className="py-3.5 px-4 text-right">Liters Filled</th>
                                <th className="py-3.5 px-4">Result Grade</th>
                                <th className="py-3.5 px-4 text-right">Streak</th>
                                <th className="py-3.5 px-4 text-right">Points</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs sm:text-sm">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="py-12 text-center text-slate-400 text-xs font-semibold"
                                    >
                                        No refill simulation logs found matching your filters.
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map((log) => (
                                    <tr
                                        key={log.id}
                                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                                    >
                                        <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                            {formatManilaDateTime(log.created_at)}
                                        </td>
                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 dark:text-white">
                                                    {log.player_name}
                                                </span>
                                                <span className="text-[9.5px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                                    {log.is_guest ? 'Guest' : 'Staff'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-3.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                                            {log.jug_type === 'slim'
                                                ? 'Slim w/ Faucet'
                                                : 'Round 20L'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {Number(log.liters_filled || 0).toFixed(2)} L
                                        </td>
                                        <td className="py-3.5 px-4">
                                            {renderGradeBadge(log.grade)}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600 dark:text-amber-400">
                                            {log.streak_count > 0 ? `${log.streak_count}x` : '—'}
                                        </td>
                                        <td className="py-3.5 px-4 text-right font-mono font-black text-[#659000] dark:text-lime-400">
                                            +{log.points_earned || 0}
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}