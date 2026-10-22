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

            // Audit Log: Accepting Account
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

            // Audit Log: Deleting Account Request
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

            // Audit Log: Promoting or Demoting
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

            // Audit Log: Revoking Authorization
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
            <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 text-slate-600">
                <p className="text-sm font-semibold">Verifying administrator authorization...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
            <Head>
                <title>User Approvals | Seaside Admin</title>
            </Head>

            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2.5 text-emerald-800">
                        <Shield className="w-6 h-6 text-emerald-600" />
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Staff Account Management</h1>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                        Authorize incoming registrations and configure user permission levels.
                    </p>
                </div>

                <button
                    onClick={fetchUsers}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-xs"
                >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                    type="button"
                    onClick={() => setActiveTab('pending')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                        activeTab === 'pending'
                            ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" /> Pending Approvals
                        </span>
                        <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                            {pendingUsers.length}
                        </span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{pendingUsers.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">New accounts awaiting administrator confirmation.</p>
                </button>

                <button
                    type="button"
                    onClick={() => setActiveTab('approved')}
                    className={`p-5 rounded-2xl border text-left transition-all ${
                        activeTab === 'approved'
                            ? 'bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/20 shadow-sm'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4" /> Active Staff & Admins
                        </span>
                        <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                            {approvedUsers.length}
                        </span>
                    </div>
                    <p className="text-2xl font-extrabold text-gray-900">{approvedUsers.length}</p>
                    <p className="text-[11px] text-gray-500 mt-1">Authorized personnel with active POS system access.</p>
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by name, email, or phone..."
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 placeholder-gray-400 outline-none focus:border-emerald-500 transition-colors"
                        />
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                        Showing <strong>{filteredUsers.length}</strong> {activeTab === 'pending' ? 'requests' : 'accounts'}
                    </span>
                </div>

                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="py-16 text-center text-xs text-gray-400 font-medium flex flex-col items-center gap-2">
                            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                            Loading accounts...
                        </div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 text-xs font-medium">
                            {searchTerm ? 'No accounts matched your search filter.' : activeTab === 'pending' ? 'No new accounts are pending approval.' : 'No active staff accounts found.'}
                        </div>
                    ) : (
                        <table className="w-full text-left text-xs divide-y divide-gray-100">
                            <thead className="bg-gray-50/80 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="py-3 px-5">Staff Member</th>
                                <th className="py-3 px-4">Contact Info</th>
                                <th className="py-3 px-4">Registration Date</th>
                                <th className="py-3 px-4 text-center">Status / Role</th>
                                <th className="py-3 px-5 text-right">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                            {filteredUsers.map((u) => {
                                const isBusy = actionLoadingId === u.id;
                                const isSelf = u.id === user?.id;

                                return (
                                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="font-bold text-gray-900 text-sm">
                                                {u.name} {isSelf && <span className="text-[10px] text-emerald-600 font-bold ml-1">(You)</span>}
                                            </div>
                                            <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                ID #{u.id}
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4">
                                            <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                                                <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{u.email || 'No email provided'}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] mt-0.5">
                                                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>{u.phone || 'No phone'}</span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-gray-500 font-medium">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span>
                                                        {u.dateadded ? format(parseISO(u.dateadded), 'MMM dd, yyyy') : 'N/A'}
                                                    </span>
                                            </div>
                                        </td>

                                        <td className="py-3.5 px-4 text-center">
                                            {u.isadmin ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                                                        <Shield className="w-3 h-3" /> Admin
                                                    </span>
                                            ) : u.is_approved ? (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                                        <UserCheck className="w-3 h-3" /> Staff
                                                    </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                        <Clock className="w-3 h-3" /> Pending Review
                                                    </span>
                                            )}
                                        </td>

                                        <td className="py-3.5 px-5 text-right">
                                            {activeTab === 'pending' ? (
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleApprove(u, false)}
                                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px]"
                                                        title="Approve as Staff"
                                                    >
                                                        <Check className="w-3.5 h-3.5" /> Approve Staff
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleApprove(u, true)}
                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1 shadow-xs text-[11px]"
                                                        title="Approve as Administrator"
                                                    >
                                                        <Shield className="w-3.5 h-3.5" /> Make Admin
                                                    </button>

                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => handleReject(u)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
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
                                                                className={`px-2.5 py-1 font-bold rounded-lg transition-all text-[11px] border ${
                                                                    u.isadmin
                                                                        ? 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100'
                                                                        : 'text-indigo-700 border-indigo-200 bg-indigo-50 hover:bg-indigo-100'
                                                                }`}
                                                            >
                                                                {u.isadmin ? 'Demote to Staff' : 'Promote to Admin'}
                                                            </button>

                                                            <button
                                                                type="button"
                                                                disabled={isBusy}
                                                                onClick={() => handleRevokeApproval(u)}
                                                                className="px-2.5 py-1 text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 rounded-lg font-bold text-[11px] transition-all"
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