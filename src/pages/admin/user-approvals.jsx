// src/pages/admin/user-approvals.jsx
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import {
    Users,
    UserCheck,
    Shield,
    Clock,
    Check,
    Trash2,
    Search,
    RefreshCw,
    Mail,
    Phone,
    Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function UserApprovalsPage() {
    const router = useRouter();
    const { user, addToast } = useStore();

    const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'approved'
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Verify Admin Access
    useEffect(() => {
        if (!user) return;
        if (!user.isadmin && user?.role?.toLowerCase() !== 'admin') {
            addToast?.({ title: 'Access Denied', description: 'Administrator privileges required.', variant: 'destructive' });
            router.push('/pos');
        }
    }, [user, router, addToast]);

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
            setPendingUsers(allUsers.filter(u => u.is_approved === false && !u.isadmin));
            setApprovedUsers(allUsers.filter(u => u.is_approved === true || u.isadmin === true));
        } catch (err) {
            console.error('Error fetching users:', err);
            addToast?.({ title: 'Fetch Error', description: err.message, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Helper: Write to activity_logs
    const logUserActivity = async ({ action, description }) => {
        try {
            await supabase.from('activity_logs').insert([{
                user_id: user?.id || null,
                user_name: user?.name || user?.username || 'Administrator',
                user_role: user?.isadmin ? 'Admin' : (user?.role || 'Admin'),
                action,
                entity_type: 'USER',
                description,
                created_at: new Date().toISOString()
            }]);
        } catch (logErr) {
            console.warn('Activity log failed:', logErr.message);
        }
    };

    // 1. ACCEPT / APPROVE USER
    const handleApprove = async (targetUser, makeAdmin = false) => {
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

            await logUserActivity({
                action: 'CREATE',
                description: makeAdmin
                    ? `Admin approved registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) and promoted directly to Administrator.`
                    : `Admin approved staff registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) with Staff permissions.`
            });

            addToast?.({
                title: 'Account Approved',
                description: `${targetUser.name} is now active as ${makeAdmin ? 'an Administrator' : 'Staff'}.`,
                variant: 'success'
            });

            fetchUsers();
        } catch (err) {
            console.error('Approval error:', err);
            addToast?.({ title: 'Approval Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 2. DELETE / REJECT USER REGISTRATION
    const handleReject = async (targetUser) => {
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

            await logUserActivity({
                action: 'DELETE',
                description: `Admin rejected and permanently deleted registration for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}).`
            });

            addToast?.({
                title: 'Registration Rejected',
                description: `Account request for ${targetUser.name} was removed.`,
                variant: 'success'
            });

            fetchUsers();
        } catch (err) {
            console.error('Reject error:', err);
            addToast?.({ title: 'Action Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 3. PROMOTING & DEMOTING USER ROLES
    const handleToggleRole = async (targetUser) => {
        if (targetUser.id === user?.id) {
            alert('You cannot change your own administrator status.');
            return;
        }

        const willBeAdmin = !targetUser.isadmin;
        setActionLoadingId(targetUser.id);

        try {
            const { error } = await supabase
                .from('users')
                .update({ isadmin: willBeAdmin })
                .eq('id', targetUser.id);

            if (error) throw error;

            await logUserActivity({
                action: 'UPDATE',
                description: willBeAdmin
                    ? `Admin promoted user "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) from Staff to Administrator.`
                    : `Admin demoted user "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}) from Administrator to Staff role.`
            });

            addToast?.({
                title: willBeAdmin ? 'User Promoted' : 'User Demoted',
                description: `${targetUser.name} is now ${willBeAdmin ? 'an Administrator' : 'Staff'}.`,
                variant: 'success'
            });

            fetchUsers();
        } catch (err) {
            console.error('Role update error:', err);
            addToast?.({ title: 'Update Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    // 4. REVOKE ACCESS (Demote back to unapproved)
    const handleRevokeApproval = async (targetUser) => {
        if (targetUser.id === user?.id) {
            alert('You cannot revoke access to your own account.');
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

            await logUserActivity({
                action: 'UPDATE',
                description: `Admin revoked system access for "${targetUser.name}" (${targetUser.email || targetUser.phone || 'No contact'}). Account moved to Pending Approval.`
            });

            addToast?.({
                title: 'Access Revoked',
                description: `${targetUser.name} has been moved back to pending approvals.`,
                variant: 'warning'
            });

            fetchUsers();
        } catch (err) {
            console.error('Revoke error:', err);
            addToast?.({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setActionLoadingId(null);
        }
    };

    const currentList = activeTab === 'pending' ? pendingUsers : approvedUsers;
    const filteredUsers = currentList.filter(u => {
        const query = searchTerm.toLowerCase();
        return (
            u.name?.toLowerCase().includes(query) ||
            u.email?.toLowerCase().includes(query) ||
            u.phone?.toLowerCase().includes(query)
        );
    });

    if (!user?.isadmin && user?.role?.toLowerCase() !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
                <p className="text-sm font-semibold">Verifying administrator authorization...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 transition-colors">
            <Head>
                <title>User Approvals | Seaside Admin</title>
            </Head>

            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100">
                        <Shield className="w-6 h-6 text-[#8DB600] dark:text-lime-400" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Staff Account Management</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Authorize incoming registrations and configure user permission levels.
                    </p>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-xs cursor-pointer select-none"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            {/* KPI Metric Toggle Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${
                        activeTab === 'pending'
                            ? 'bg-amber-50/70 dark:bg-amber-950/25 border-amber-300 dark:border-amber-600/70 ring-2 ring-amber-400/20 dark:ring-amber-500/20 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Pending Approvals
                        </span>
                        <span className="text-xs font-black bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800/80">
                            {pendingUsers.length}
                        </span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{pendingUsers.length}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">New accounts awaiting administrator confirmation.</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('approved')}
                    className={`p-5 rounded-2xl border text-left transition-all cursor-pointer select-none ${
                        activeTab === 'approved'
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-600/70 ring-2 ring-emerald-400/20 dark:ring-emerald-500/20 shadow-sm'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4" /> Active Staff & Admins
                        </span>
                        <span className="text-xs font-black bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                            {approvedUsers.length}
                        </span>
                    </div>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{approvedUsers.length}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Authorized personnel with active POS system access.</p>
                </button>
            </div>

            {/* Registry Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
                <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#8DB600] dark:focus:border-lime-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
                        />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                        Showing <strong className="text-slate-900 dark:text-slate-100">{filteredUsers.length}</strong> {activeTab === 'pending' ? 'requests' : 'accounts'}
                    </span>
                </div>

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
                                const isSelf = u.id === user?.id;

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
                                                <span>
                                                        {u.dateadded ? format(parseISO(u.dateadded), 'MMM dd, yyyy') : 'N/A'}
                                                    </span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                                            {u.isadmin ? (
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
                                                        disabled={isBusy}
                                                        onClick={() => handleApprove(u, false)}
                                                        className="px-3 py-1.5 bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                                        title="Approve as Staff"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Approve Staff
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleApprove(u, true)}
                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px] cursor-pointer"
                                                        title="Approve as Administrator"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" /> Make Admin
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
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
                                                                disabled={isBusy}
                                                                onClick={() => handleToggleRole(u)}
                                                                className={`px-2.5 py-1 font-bold rounded-lg transition-all text-[11px] border cursor-pointer ${
                                                                    u.isadmin
                                                                        ? 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                                                                        : 'text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'
                                                                }`}
                                                            >
                                                                {u.isadmin ? 'Demote to Staff' : 'Promote to Admin'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => handleRevokeApproval(u)}
                                                                className="px-2.5 py-1 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-lg font-bold text-[11px] transition-all cursor-pointer"
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
        </div>
    );
}