// src/pages/admin/user-approvals.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import { logActivity } from '../../hooks/useActivityLogs';
import UserApprovalsTour from '../../components/admin/UserApprovalsTour';
import {
    UserCheck,
    Shield,
    Clock,
    Check,
    Trash2,
    Search,
    RefreshCw,
    Mail,
    Phone,
    Calendar,
    X,
    ArrowLeft
} from 'lucide-react';

const formatManilaDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return 'N/A';
        return d.toLocaleDateString('en-US', {
            timeZone: 'Asia/Manila',
            month: 'short',
            day: '2-digit',
            year: 'numeric'
        });
    } catch {
        return 'N/A';
    }
};

export default function UserApprovalsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const user = useStore((s) => s.user);
    const sessionLoaded = useStore((s) => s.sessionLoaded);
    const addToast = useStore((s) => s.addToast);
    const isDemo = Boolean(user?.isDemo);

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

    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const searchInputRef = useRef(null);

    // Verify Admin Access once session is loaded
    useEffect(() => {
        if (!sessionLoaded || !user) return;
        if (!isAdmin) {
            addToast?.({ title: 'Access Denied', description: 'Administrator privileges required.', variant: 'destructive' });
            router.push('/pos');
        }
    }, [sessionLoaded, user, isAdmin, router, addToast]);

    // Keyboard shortcut (/) to focus search
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

    // Fetch Accounts
    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .order('dateadded', { ascending: false });

            if (error) throw error;

            const allUsers = data || [];
            setPendingUsers(allUsers.filter((u) => u.is_approved === false && !u.isadmin && !u.is_admin));
            setApprovedUsers(allUsers.filter((u) => u.is_approved === true || u.isadmin === true || u.is_admin === true));
        } catch (err) {
            console.error('Error fetching users:', err);
            addToast?.({ title: 'Fetch Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            fetchUsers();
        }
    }, [isAdmin]);

    const syncUserCaches = () => {
        queryClient.invalidateQueries({ queryKey: ['pending-approvals-count'] });
        queryClient.invalidateQueries({ queryKey: ['user-management-stats'] });
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    };

    const totalAdminsCount = useMemo(() => {
        return approvedUsers.filter((u) => u.isadmin === true || u.is_admin === true).length;
    }, [approvedUsers]);

    // 1. ACCEPT / APPROVE USER
    const handleApprove = async (targetUser, makeAdmin = false) => {
        if (isDemo) {
            addToast?.({ title: 'Demo Mode', description: 'Approving users is disabled in demo mode.', variant: 'warning' });
            return;
        }
        setActionLoadingId(targetUser.id);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    is_approved: true,
                    isadmin: makeAdmin
                })
                .eq('id', targetUser.id);

            if (error) throw error;

            await logActivity({
                user,
                action: 'CREATE',
                entity_type: 'USER',
                description: makeAdmin
                    ? `Admin approved registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) and promoted directly to Administrator.`
                    : `Admin approved staff registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) with Staff permissions.`
            });

            addToast?.({
                title: 'Account Approved',
                description: `${targetUser.name} is now active as ${makeAdmin ? 'an Administrator' : 'Staff'}.`,
                variant: 'success'
            });

            syncUserCaches();
            await fetchUsers();
        } catch (err) {
            console.error('Approval error:', err);
            addToast?.({ title: 'Approval Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 2. DELETE / REJECT USER REGISTRATION
    const handleReject = async (targetUser) => {
        if (isDemo) {
            addToast?.({ title: 'Demo Mode', description: 'Rejecting users is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (!window.confirm(`Are you sure you want to reject and remove the registration for "${targetUser.name}"?`)) {
            return;
        }

        setActionLoadingId(targetUser.id);
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', targetUser.id);

            if (error) throw error;

            await logActivity({
                user,
                action: 'DELETE',
                entity_type: 'USER',
                description: `Admin rejected and permanently deleted registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}).`
            });

            addToast?.({
                title: 'Registration Rejected',
                description: `Account request for ${targetUser.name} was removed.`,
                variant: 'success'
            });

            syncUserCaches();
            await fetchUsers();
        } catch (err) {
            console.error('Reject error:', err);
            addToast?.({ title: 'Action Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 3. PROMOTING & DEMOTING USER ROLES
    const handleToggleRole = async (targetUser) => {
        if (isDemo) {
            addToast?.({ title: 'Demo Mode', description: 'Changing user roles is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (String(targetUser.id) === String(user?.id)) {
            addToast?.({ title: 'Action Blocked', description: 'You cannot change your own administrator status.', variant: 'warning' });
            return;
        }

        const isTargetAdmin = targetUser.isadmin === true || targetUser.is_admin === true;
        if (isTargetAdmin && totalAdminsCount <= 1) {
            addToast?.({
                title: 'Action Blocked',
                description: 'Cannot demote the last remaining administrator account.',
                variant: 'destructive'
            });
            return;
        }

        const willBeAdmin = !isTargetAdmin;
        setActionLoadingId(targetUser.id);

        try {
            const { error } = await supabase
                .from('users')
                .update({ isadmin: willBeAdmin })
                .eq('id', targetUser.id);

            if (error) throw error;

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'USER',
                description: willBeAdmin
                    ? `Admin promoted user "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) from Staff to Administrator.`
                    : `Admin demoted user "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) from Administrator to Staff role.`
            });

            addToast?.({
                title: willBeAdmin ? 'User Promoted' : 'User Demoted',
                description: `${targetUser.name} is now ${willBeAdmin ? 'an Administrator' : 'Staff'}.`,
                variant: 'success'
            });

            syncUserCaches();
            await fetchUsers();
        } catch (err) {
            console.error('Role update error:', err);
            addToast?.({ title: 'Update Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 4. REVOKE ACCESS (Demote back to unapproved)
    const handleRevokeApproval = async (targetUser) => {
        if (isDemo) {
            addToast?.({ title: 'Demo Mode', description: 'Revoking access is disabled in demo mode.', variant: 'warning' });
            return;
        }
        if (String(targetUser.id) === String(user?.id)) {
            addToast?.({ title: 'Action Blocked', description: 'You cannot revoke access to your own account.', variant: 'warning' });
            return;
        }

        const isTargetAdmin = targetUser.isadmin === true || targetUser.is_admin === true;
        if (isTargetAdmin && totalAdminsCount <= 1) {
            addToast?.({
                title: 'Action Blocked',
                description: 'Cannot revoke access for the last remaining administrator.',
                variant: 'destructive'
            });
            return;
        }

        if (!window.confirm(`Revoke login access for "${targetUser.name}"? They will not be able to log in until re-approved.`)) {
            return;
        }

        setActionLoadingId(targetUser.id);
        try {
            const { error } = await supabase
                .from('users')
                .update({ is_approved: false, isadmin: false })
                .eq('id', targetUser.id);

            if (error) throw error;

            await logActivity({
                user,
                action: 'UPDATE',
                entity_type: 'USER',
                description: `Admin revoked system access for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}). Account moved to Pending Approval.`
            });

            addToast?.({
                title: 'Access Revoked',
                description: `${targetUser.name} has been moved back to pending approvals.`,
                variant: 'warning'
            });

            syncUserCaches();
            await fetchUsers();
        } catch (err) {
            console.error('Revoke error:', err);
            addToast?.({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    const currentList = activeTab === 'pending' ? pendingUsers : approvedUsers;
    const filteredUsers = currentList.filter((u) => {
        const query = searchTerm.toLowerCase();
        return (
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.phone?.toLowerCase().includes(query)
        );
    });

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                <p className="text-sm font-semibold">Verifying administrator authorization...</p>
            </div>
        );
    }

    return (
        <div className="user-approvals-page w-full max-w-7xl mx-auto px-1.5 py-2 sm:p-6 lg:p-8 space-y-2.5 sm:space-y-6 pb-24 md:pb-8 transition-colors">
            <Head>
                <title>User Approvals | Seaside Admin</title>
            </Head>

            <style jsx global>{`
                @media (max-width: 639px) {
                    .app:has(.user-approvals-page) .container {
                        max-width: 100% !important;
                        width: 100% !important;
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                    }
                    .app:has(.user-approvals-page) .main {
                        padding-left: 0 !important;
                        padding-right: 0 !important;
                    }
                }
            `}</style>

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 px-0.5 sm:px-0">
                <div>
                    <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-[#8DB600] dark:text-lime-400 shrink-0" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Staff Account Management</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Authorize incoming registrations and configure user permission levels.
                    </p>
                </div>

                <div
                    id="tour-approvals-header-actions"
                    className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0"
                >
                    <Link
                        href="/user-management"
                        className="w-full sm:w-auto h-9 inline-flex items-center justify-center gap-1.5 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                        <span>All Users</span>
                    </Link>

                    <button
                        type="button"
                        onClick={fetchUsers}
                        disabled={isLoading}
                        className="w-full sm:w-auto h-9 inline-flex items-center justify-center gap-1.5 px-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer select-none"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* KPI Metric Toggle Cards (Side-by-side 2-column on all screens) */}
            <div id="tour-approvals-tabs" className="grid grid-cols-2 gap-2 sm:gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer select-none min-w-0 ${
                        activeTab === 'pending'
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-600/70 ring-2 ring-amber-400/20 dark:ring-amber-500/20 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1 sm:gap-1.5 min-w-0">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">
                                <span className="sm:hidden">Pending</span>
                                <span className="hidden sm:inline">Pending Approvals</span>
                            </span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2 sm:px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/80 shrink-0">
                            {pendingUsers.length}
                        </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{pendingUsers.length}</p>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Awaiting admin confirmation
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('approved')}
                    className={`p-2.5 sm:p-5 rounded-xl sm:rounded-2xl border text-left transition-all cursor-pointer select-none min-w-0 ${
                        activeTab === 'approved'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-600/70 ring-2 ring-emerald-400/20 dark:ring-emerald-500/20 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between gap-1 mb-1 sm:mb-2">
                        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1 sm:gap-1.5 min-w-0">
                            <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                            <span className="truncate">
                                <span className="sm:hidden">Active</span>
                                <span className="hidden sm:inline">Active Staff &amp; Admins</span>
                            </span>
                        </span>
                        <span className="text-[10px] sm:text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2 sm:px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80 shrink-0">
                            {approvedUsers.length}
                        </span>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{approvedUsers.length}</p>
                    <p className="text-[10.5px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-none">
                        Authorized POS personnel
                    </p>
                </button>
            </div>

            {/* Search & Count Bar */}
            <div
                id="tour-approvals-search"
                className="bg-white dark:bg-slate-900 p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 transition-colors"
            >
                <div className="relative w-full sm:max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search name, email, or phone... (/)"
                        className="w-full h-9 sm:h-10 pl-9 pr-8 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#8DB600] dark:focus:border-lime-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            aria-label="Clear search"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded-full cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
                <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium px-0.5 sm:px-0">
                    Showing <strong className="text-slate-900 dark:text-slate-100">{filteredUsers.length}</strong> {activeTab === 'pending' ? 'requests' : 'accounts'}
                </span>
            </div>

            {/* Mobile Card List View (< 768px) */}
            <div id="tour-approvals-mobile-list" className="block md:hidden space-y-2">
                {isLoading ? (
                    <div className="py-10 text-center text-xs text-slate-400 dark:text-slate-500 font-medium flex flex-col items-center gap-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        <RefreshCw className="w-5 h-5 animate-spin text-[#8DB600] dark:text-lime-400" />
                        <span>Loading accounts...</span>
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="py-10 px-4 text-center text-slate-400 dark:text-slate-500 text-xs font-medium bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                        {searchTerm
                            ? 'No accounts matched your search filter.'
                            : activeTab === 'pending'
                                ? 'No new accounts are pending approval.'
                                : 'No active staff accounts found.'}
                    </div>
                ) : (
                    filteredUsers.map((u) => {
                        const isBusy = actionLoadingId === u.id;
                        const isSelf = String(u.id) === String(user?.id);
                        const isUserAdmin = u.isadmin === true || u.is_admin === true;
                        const isLastAdmin = isUserAdmin && totalAdminsCount <= 1;

                        return (
                            <div
                                key={u.id}
                                className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate">
                                            {u.name}{' '}
                                            {isSelf && (
                                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                                                    (You)
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[10.5px] text-slate-400 dark:text-slate-500 font-mono">
                                            ID #{u.id} • Registered {formatManilaDate(u.dateadded)}
                                        </div>
                                    </div>

                                    {isUserAdmin ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 rounded-md shrink-0">
                                            <Shield className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Admin
                                        </span>
                                    ) : u.is_approved ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-md shrink-0">
                                            <UserCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Staff
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-md shrink-0">
                                            <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Pending
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-1 text-xs bg-slate-50 dark:bg-slate-800/60 px-2.5 py-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium truncate">
                                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{u.email || 'No email provided'}</span>
                                    </div>
                                    {u.phone && (
                                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                            <span className="font-mono">{u.phone}</span>
                                        </div>
                                    )}
                                </div>

                                {activeTab === 'pending' ? (
                                    <div className="flex items-center gap-1.5 pt-1">
                                        <button
                                            type="button"
                                            disabled={isBusy || isDemo}
                                            onClick={() => handleApprove(u, false)}
                                            className="flex-1 py-2 px-2.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                        >
                                            <Check className="w-3.5 h-3.5 shrink-0" />
                                            <span>Approve Staff</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isBusy || isDemo}
                                            onClick={() => handleApprove(u, true)}
                                            className="flex-1 py-2 px-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                        >
                                            <Shield className="w-3.5 h-3.5 shrink-0" />
                                            <span>Make Admin</span>
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isBusy || isDemo}
                                            onClick={() => handleReject(u)}
                                            className="p-2 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                                            title="Reject Registration"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    !isSelf && (
                                        <div className="flex items-center gap-1.5 pt-1">
                                            <button
                                                type="button"
                                                disabled={isBusy || isDemo || isLastAdmin}
                                                onClick={() => handleToggleRole(u)}
                                                className={`flex-1 py-1.5 px-2.5 font-bold rounded-lg transition-all text-[11px] border cursor-pointer disabled:opacity-40 ${
                                                    isUserAdmin
                                                        ? 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40'
                                                        : 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40'
                                                }`}
                                            >
                                                {isUserAdmin ? 'Demote to Staff' : 'Promote to Admin'}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={isBusy || isDemo || isLastAdmin}
                                                onClick={() => handleRevokeApproval(u)}
                                                className="py-1.5 px-3 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 rounded-lg font-bold text-[11px] transition-all cursor-pointer disabled:opacity-40"
                                            >
                                                Revoke
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Registry Table (>= 768px) */}
            <div
                id="tour-approvals-desktop-table"
                className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors"
            >
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 font-medium flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-[#8DB600] dark:text-lime-400" />
                            Loading accounts...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs font-medium">
                            {searchTerm ? 'No accounts matched your search filter.' : activeTab === 'pending' ? 'No new accounts are pending approval.' : 'No active staff accounts found.'}
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                            <thead className="bg-slate-50/80 dark:bg-slate-800/90 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800">
                            <tr>
                                <th className="py-3 px-5">Staff Member</th>
                                <th className="py-3 px-4">Contact Info</th>
                                <th className="py-3 px-4">Registration Date</th>
                                <th className="py-3 px-4 text-center">Status / Role</th>
                                <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                            {filteredUsers.map((u) => {
                                const isBusy = actionLoadingId === u.id;
                                const isSelf = String(u.id) === String(user?.id);
                                const isUserAdmin = u.isadmin === true || u.is_admin === true;
                                const isLastAdmin = isUserAdmin && totalAdminsCount <= 1;

                                return (
                                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                                                {u.name} {isSelf && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold ml-1">(You)</span>}
                                            </div>
                                            <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                                                ID #{u.id}
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                                                <Mail className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span className="truncate max-w-[200px]">{u.email || 'No email provided'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                                                <Phone className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span>{u.phone || 'No phone'}</span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                                            <div className="flex items-center gap-1.5 whitespace-nowrap">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                                                <span>{formatManilaDate(u.dateadded)}</span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {isUserAdmin ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2.5 py-0.5 rounded-md shadow-2xs">
                                                    <Shield className="w-3 h-3 text-indigo-500 dark:text-indigo-400" /> Admin
                                                </span>
                                            ) : u.is_approved ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-md shadow-2xs">
                                                    <UserCheck className="w-3 h-3 text-emerald-500 dark:text-emerald-400" /> Staff
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2.5 py-0.5 rounded-md shadow-2xs">
                                                    <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" /> Pending Review
                                                </span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                                            {activeTab === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isBusy || isDemo}
                                                        onClick={() => handleApprove(u, false)}
                                                        className="px-3 py-1.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                                        title="Approve as Staff"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Approve Staff
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy || isDemo}
                                                        onClick={() => handleApprove(u, true)}
                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                                        title="Approve as Administrator"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" /> Make Admin
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy || isDemo}
                                                        onClick={() => handleReject(u)}
                                                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                                                        title="Reject Registration"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isSelf && (
                                                        <>
                                                            <button
                                                                type="button"
                                                                disabled={isBusy || isDemo || isLastAdmin}
                                                                onClick={() => handleToggleRole(u)}
                                                                className={`px-2.5 py-1 font-bold rounded-lg transition-all text-[11px] border cursor-pointer disabled:opacity-40 ${
                                                                    isUserAdmin
                                                                        ? 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                                                                        : 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                                                }`}
                                                            >
                                                                {isUserAdmin ? 'Demote to Staff' : 'Promote to Admin'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={isBusy || isDemo || isLastAdmin}
                                                                onClick={() => handleRevokeApproval(u)}
                                                                className="px-2.5 py-1 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg font-bold text-[11px] transition-all cursor-pointer disabled:opacity-40"
                                                            >
                                                                Revoke
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            <UserApprovalsTour
                isApprovalsLoading={isLoading}
                activeTab={activeTab}
            />
        </div>
    );
}