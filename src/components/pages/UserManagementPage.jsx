// src/components/pages/UserManagementPage.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabaseClient';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    Select
} from '../ui';
import Checkbox from '../ui/Checkbox';
import Pagination from '../Pagination';

import {
    useUsers,
    useUserCategories,
    useCreateUser,
    useUpdateUser,
    useDeleteUser,
    useCreateUserCategory
} from '../../hooks/useUserMutations';

import {
    UserPlus, Pencil, Trash2, Shield, Mail,
    Lock, Briefcase, Search, User as UserIcon,
    Users, ShieldCheck, UserCheck, AlertCircle, ArrowUpRight
} from 'lucide-react';

// Standardized Role Badge
const RoleBadge = ({ categoryName, isAdmin }) => {
    return (
        <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                isAdmin
                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
            }`}
        >
            {categoryName || (isAdmin ? 'Admin' : 'Staff')}
        </span>
    );
};

export default function UserManagementPage() {
    const addToast = useStore(s => s.addToast);
    const { user: currentUser, isDemo } = useStore(s => ({
        user: s.user,
        isDemo: s.user?.isDemo
    }));

    // Security Check: Allow User ID:1 OR any flagged Admin to manage users
    const canManageUsers = currentUser?.id === 1 || currentUser?.isAdmin || currentUser?.isadmin;

    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const createCategory = useCreateUserCategory();

    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleIsAdmin, setNewRoleIsAdmin] = useState(false);

    const handleAddRole = async (e) => {
        e.preventDefault();
        if (!newRoleName || newRoleName.trim() === '') {
            addToast({ title: 'Error', description: "Role name is required.", variant: 'destructive' });
            return;
        }

        try {
            const newRole = await createCategory.mutateAsync({ name: newRoleName.trim(), isAdmin: newRoleIsAdmin });
            if (newRole) {
                setCategoryId(newRole.id);
            }
            closeAddRoleModal();
            addToast({ title: 'Role Created', description: `Added role "${newRoleName.trim()}".`, variant: 'success' });
        } catch (err) {
            console.error(err);
            addToast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    };

    const openAddRoleModal = () => {
        setNewRoleName('');
        setNewRoleIsAdmin(false);
        setIsAddRoleModalOpen(true);
    };

    const closeAddRoleModal = () => {
        setIsAddRoleModalOpen(false);
    };

    const { data: categories = [] } = useUserCategories();

    // Filter, Search & Pagination State
    const [roleFilter, setRoleFilter] = useState('all'); // 'all' | 'admin' | 'staff'
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [color, setColor] = useState('#3B82F6');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: usersData = { users: [], totalPages: 1 }, isLoading } = useUsers({
        page: currentPage,
        itemsPerPage,
        searchTerm
    });

    const users = usersData.users;
    const totalPages = usersData.totalPages;
    const searchInputRef = useRef(null);

    // Live Metrics Query for KPI Cards
    const { data: userStats = { total: 0, admins: 0, staff: 0, pending: 0 } } = useQuery({
        queryKey: ['user-management-stats', isDemo],
        queryFn: async () => {
            if (isDemo) {
                return { total: 3, admins: 3, staff: 0, pending: 0 };
            }
            const { data, error } = await supabase
                .from('users')
                .select('id, isadmin, is_approved, category_id');

            if (error || !data) return { total: 0, admins: 0, staff: 0, pending: 0 };

            let admins = 0;
            let staff = 0;
            let pending = 0;

            data.forEach(u => {
                if (u.is_approved === false && u.isadmin !== true) {
                    pending += 1;
                } else if (u.isadmin === true) {
                    admins += 1;
                } else {
                    staff += 1;
                }
            });

            return {
                total: data.length,
                admins,
                staff,
                pending
            };
        },
        staleTime: 1000 * 60 * 2
    });

    // Count how many admins exist to prevent locking out the station
    const adminCount = useMemo(() => {
        return users.filter(u => u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin').length;
    }, [users]);

    // Filtered Users by Role Chip
    const filteredUsers = useMemo(() => {
        if (roleFilter === 'admin') {
            return users.filter(u => u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin');
        }
        if (roleFilter === 'staff') {
            return users.filter(u => !(u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin'));
        }
        return users;
    }, [users, roleFilter]);

    // Default category ID selection
    useEffect(() => {
        if (!editing && categories.length > 0 && !categoryId) {
            setCategoryId(categories[0].id);
        }
    }, [categories, editing, categoryId]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
                return;
            }
            if (e.key === 'Escape' && isAddRoleModalOpen) {
                closeAddRoleModal();
                return;
            }
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen, isAddRoleModalOpen]);

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(resetForm, 200);
    };

    const startEdit = (u) => {
        setEditing(u);
        setName(u?.name || '');
        setEmail(u?.email || '');
        setCategoryId(u?.categoryId || (categories.length > 0 ? categories[0].id : ''));
        setColor(u?.color || '#3B82F6');
        setPassword('');
        setConfirmPassword('');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setEmail('');
        setCategoryId(categories.length > 0 ? categories[0].id : '');
        setColor('#3B82F6');
        setPassword('');
        setConfirmPassword('');
    };

    const save = async (e) => {
        e.preventDefault();

        if (password && password !== confirmPassword) {
            addToast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
            return;
        }

        const payload = {
            name: name.trim(),
            email: email.trim(),
            categoryId: Number(categoryId),
            color
        };
        if (password) payload.password = password;

        try {
            if (editing) {
                await updateUser.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'User Updated', description: `${name} was successfully updated.`, variant: 'success' });
            } else {
                await createUser.mutateAsync(payload);
                addToast({ title: 'User Created', description: `${name} has been added to the system.`, variant: 'success' });
            }
            closeModal();
        } catch (err) {
            console.error(err);
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        }
    };

    const remove = async (u) => {
        const isSelf = String(u.id) === String(currentUser?.id);
        if (isSelf) {
            addToast({
                title: 'Action Blocked',
                description: 'You cannot delete your own account while logged in.',
                variant: 'destructive'
            });
            return;
        }

        const isUserAdmin = u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin';
        if (isUserAdmin && adminCount <= 1) {
            addToast({
                title: 'Action Blocked',
                description: 'Cannot delete the last remaining admin account.',
                variant: 'destructive'
            });
            return;
        }

        if (!confirm(`Delete ${u.name}? This action cannot be undone.`)) return;

        try {
            await deleteUser.mutateAsync(u.id);
            addToast({ title: 'Deleted', description: `${u.name} was removed.`, variant: 'success' });
        } catch (err) {
            console.error(err);
            addToast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
        }
    };

    const isMutating = createUser.isPending || updateUser.isPending || deleteUser.isPending;

    return (
        <div className="user-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 overflow-x-hidden">
            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">User Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Add, edit, or manage staff and administrator credentials.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        onClick={openModal}
                        variant="primary"
                        disabled={isDemo || !canManageUsers}
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
                        title={!canManageUsers ? "Only Admins can add users" : ""}
                    >
                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add User</span>
                    </Button>
                </div>
            </div>

            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Accounts</span>
                        <span className="text-xl font-black text-slate-900">{userStats.total || users.length}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Administrators</span>
                        <span className="text-xl font-black text-purple-700">{userStats.admins || adminCount}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Staff & Cashiers</span>
                        <span className="text-xl font-black text-blue-600">{userStats.staff}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <UserCheck className="w-5 h-5" />
                    </div>
                </div>

                <Link href="/admin/user-approvals" className="block group">
                    <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                        userStats.pending > 0
                            ? 'bg-amber-50/70 border-amber-200 shadow-2xs hover:border-amber-300'
                            : 'bg-white border-slate-200/90 shadow-2xs hover:border-slate-300'
                    }`}>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Approvals</span>
                                <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                            <span className={`text-xl font-black ${userStats.pending > 0 ? 'text-amber-700' : 'text-slate-900'}`}>
                                {userStats.pending}
                            </span>
                        </div>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            userStats.pending > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
                        }`}>
                            <AlertCircle className="w-5 h-5" />
                        </div>
                    </div>
                </Link>
            </div>

            {/* Filter / Search Bar with Role Chips */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:max-w-md">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search users by name, email... (/)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                    />
                </div>

                {/* Role Filter Chips */}
                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Role:</span>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            roleFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All ({users.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('admin')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                            roleFilter === 'admin'
                                ? 'bg-purple-700 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>Admins</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'admin' ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-700'}`}>
                            {adminCount}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setRoleFilter('staff')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                            roleFilter === 'staff'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>Staff</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${roleFilter === 'staff' ? 'bg-blue-400 text-white' : 'bg-blue-100 text-blue-700'}`}>
                            {Math.max(0, users.length - adminCount)}
                        </span>
                    </button>
                </div>
            </div>

            {/* Desktop Table View */}
            <Card className="hidden md:block border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-0 overflow-x-hidden">
                    <div className="w-full overflow-hidden">
                        <Table className="w-full table-auto text-xs sm:text-sm">
                            <TableHeader>
                                <TableRow className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                                    <TableHead className="py-3 px-4 text-left">Staff Name</TableHead>
                                    <TableHead className="py-3 px-4 text-left">Email Address</TableHead>
                                    <TableHead className="py-3 px-4 text-left">Role</TableHead>
                                    <TableHead className="py-3 px-4 text-left">Date Added</TableHead>
                                    <TableHead className="py-3 px-4 text-right w-24">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-slate-100 bg-white">
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                                            Loading users...
                                        </TableCell>
                                    </TableRow>
                                ) : filteredUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                                            No users found matching your filter.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredUsers.map(u => {
                                        const isSelf = String(u.id) === String(currentUser?.id);
                                        const isUserAdmin = u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin';
                                        const isProtectedLastAdmin = isUserAdmin && adminCount <= 1;

                                        return (
                                            <TableRow key={u.id} className="hover:bg-slate-50/70 transition-colors">
                                                {/* Staff Name with Avatar Badge */}
                                                <TableCell className="py-3 px-4">
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                                                            style={{ backgroundColor: u.color || '#3B82F6' }}
                                                        >
                                                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-bold text-slate-900 truncate">
                                                                {u.name}
                                                                {isSelf && (
                                                                    <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1.5">
                                                                        You
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Email Address */}
                                                <TableCell className="py-3 px-4 text-slate-600 font-medium">
                                                    {u.email || '—'}
                                                </TableCell>

                                                {/* Role Badge */}
                                                <TableCell className="py-3 px-4">
                                                    <RoleBadge categoryName={u.categoryName} isAdmin={u.isAdmin || u.isadmin} />
                                                </TableCell>

                                                {/* Date Added */}
                                                <TableCell className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                                                    {u.dateAdded instanceof Date && !isNaN(u.dateAdded)
                                                        ? u.dateAdded.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : '—'}
                                                </TableCell>

                                                {/* Standardized Action Buttons with Guardrails */}
                                                <TableCell className="py-3 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEdit(u)}
                                                            disabled={isDemo || !canManageUsers}
                                                            className="w-7 h-7 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                            title="Edit user credentials"
                                                        >
                                                            <Pencil className="w-3.5 h-3.5" />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => remove(u)}
                                                            disabled={isDemo || !canManageUsers || isSelf || isProtectedLastAdmin}
                                                            className={`w-7 h-7 flex items-center justify-center border rounded-lg transition-colors ${
                                                                isSelf || isProtectedLastAdmin
                                                                    ? 'text-slate-300 border-slate-100 cursor-not-allowed bg-slate-50'
                                                                    : 'text-rose-600 hover:bg-rose-50 border-slate-200'
                                                            }`}
                                                            title={
                                                                isSelf
                                                                    ? "Cannot delete your own active account"
                                                                    : isProtectedLastAdmin
                                                                        ? "Cannot delete the sole remaining administrator"
                                                                        : "Delete user account"
                                                            }
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="p-3 border-t border-slate-100 flex justify-end">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages || 1}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card List View */}
            <div className="space-y-3 md:hidden">
                {isLoading ? (
                    <div className="text-center py-12 text-slate-400 text-xs">Loading users...</div>
                ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
                        No users found matching your filter.
                    </div>
                ) : (
                    filteredUsers.map(u => {
                        const isSelf = String(u.id) === String(currentUser?.id);
                        const isUserAdmin = u.isAdmin || u.isadmin || u.categoryName?.toLowerCase() === 'admin';
                        const isProtectedLastAdmin = isUserAdmin && adminCount <= 1;

                        return (
                            <div key={u.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-2xs"
                                            style={{ backgroundColor: u.color || '#3B82F6' }}
                                        >
                                            {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-bold text-sm text-slate-900 truncate">
                                                {u.name} {isSelf && <span className="text-[10px] text-slate-400 font-normal ml-1">(You)</span>}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                                        </div>
                                    </div>
                                    <RoleBadge categoryName={u.categoryName} isAdmin={u.isAdmin || u.isadmin} />
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                                    <span>
                                        Added: {u.dateAdded instanceof Date && !isNaN(u.dateAdded)
                                        ? u.dateAdded.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                                        : '—'}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => startEdit(u)}
                                            disabled={isDemo || !canManageUsers}
                                            className="p-1.5 text-blue-600 border border-slate-200 rounded-lg hover:bg-blue-50 transition-colors"
                                            title="Edit user"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => remove(u)}
                                            disabled={isDemo || !canManageUsers || isSelf || isProtectedLastAdmin}
                                            className={`p-1.5 border rounded-lg transition-colors ${
                                                isSelf || isProtectedLastAdmin
                                                    ? 'text-slate-300 border-slate-100 bg-slate-50 cursor-not-allowed'
                                                    : 'text-rose-600 hover:bg-rose-50 border-slate-200'
                                            }`}
                                            title={isSelf ? "Cannot delete yourself" : isProtectedLastAdmin ? "Sole admin" : "Delete"}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {filteredUsers.length > 0 && (
                    <div className="pt-2">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages || 1}
                            onPageChange={page => setCurrentPage(page)}
                        />
                    </div>
                )}
            </div>

            {/* MODAL: Add / Edit User */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 sm:max-w-xl w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                                {editing ? 'Edit User Credentials' : 'Add New User'}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {editing ? 'Update staff roles and authentication details.' : 'Register new cashier or administrator account.'}
                            </p>
                        </div>
                        <DialogCloseButton onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                    </DialogHeader>

                    <form onSubmit={save} className="flex flex-col max-h-[80vh]">
                        <div className="overflow-y-auto px-6 py-5 space-y-5">
                            <div>
                                <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                                    Full Name <span className="text-rose-500">*</span>
                                </Label>
                                <div className="relative mt-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="e.g. Juan Dela Cruz"
                                        className="w-full text-xs pl-9 py-2 border-slate-200 rounded-xl h-10"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                                        Email Address <span className="text-rose-500">*</span>
                                    </Label>
                                    <div className="relative mt-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            placeholder="staff@seaside.com"
                                            className="w-full text-xs pl-9 py-2 border-slate-200 rounded-xl h-10"
                                            disabled={isDemo}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="category_id" className="text-xs font-bold text-slate-700">User Role</Label>
                                    <div className="flex items-center space-x-2 mt-1">
                                        <div className="relative flex-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Briefcase className="w-4 h-4" />
                                            </div>
                                            <Select
                                                id="category_id"
                                                value={categoryId}
                                                onChange={(e) => setCategoryId(e.target.value)}
                                                className="w-full text-xs pl-9 py-2 border-slate-200 rounded-xl h-10 appearance-none bg-white"
                                                disabled={isDemo || categories.length === 0}
                                            >
                                                <option value="" disabled>Select a role...</option>
                                                {categories.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </Select>
                                        </div>

                                        {!editing && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="h-10 px-3 rounded-xl text-xs font-bold border-slate-200"
                                                onClick={openAddRoleModal}
                                                disabled={isDemo || createCategory.isPending}
                                                title="Add new role"
                                            >
                                                + New
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="color" className="text-xs font-bold text-slate-700">Assigned Station Palette</Label>
                                <div className="flex items-center space-x-3 mt-1">
                                    <Input
                                        id="color"
                                        type="color"
                                        value={color}
                                        onChange={(e) => setColor(e.target.value)}
                                        className="w-12 h-9 p-0.5 cursor-pointer border border-slate-200 rounded-xl bg-white shadow-2xs"
                                        disabled={isDemo}
                                    />
                                    <span className="text-xs text-slate-500">Color badge used in receipts and activity audit trails.</span>
                                </div>
                            </div>

                            <div className="pt-2 border-t border-slate-100 space-y-4">
                                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    {editing ? 'Change Password (Leave blank to keep existing)' : 'Security / Initial Password'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                                            Password {!editing && <span className="text-rose-500">*</span>}
                                        </Label>
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required={!editing}
                                                placeholder="••••••••"
                                                className="w-full text-xs pl-9 py-2 border-slate-200 rounded-xl h-10"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="confirmPassword" className="text-xs font-bold text-slate-700">
                                            Confirm Password {!editing && <span className="text-rose-500">*</span>}
                                        </Label>
                                        <div className="relative mt-1">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                <Lock className="w-4 h-4" />
                                            </div>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required={!editing}
                                                placeholder="••••••••"
                                                className="w-full text-xs pl-9 py-2 border-slate-200 rounded-xl h-10"
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5 mt-auto">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={closeModal}
                                disabled={isMutating}
                                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isMutating || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                            >
                                {isMutating ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* MODAL: Add New Role */}
            <Dialog open={isAddRoleModalOpen} onOpenChange={setIsAddRoleModalOpen}>
                <DialogContent className="p-0 sm:max-w-md w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                        <DialogTitle className="text-base font-black text-slate-900 tracking-tight">
                            Add New Role Category
                        </DialogTitle>
                        <DialogCloseButton onClick={closeAddRoleModal} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                    </DialogHeader>
                    <form onSubmit={handleAddRole}>
                        <div className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="newRoleName" className="text-xs font-bold text-slate-700">Role Name</Label>
                                <Input
                                    id="newRoleName"
                                    value={newRoleName}
                                    onChange={(e) => setNewRoleName(e.target.value)}
                                    placeholder="e.g., Manager, Cashier, Delivery Staff"
                                    required
                                    autoFocus
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                />
                            </div>
                            <div className="flex items-center space-x-2 pt-1">
                                <Checkbox
                                    id="newRoleIsAdmin"
                                    checked={newRoleIsAdmin}
                                    onChange={(e) => setNewRoleIsAdmin(e.target.checked)}
                                />
                                <Label htmlFor="newRoleIsAdmin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                                    Grant Administrator Privileges
                                </Label>
                            </div>
                        </div>
                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
                            <Button variant="outline" type="button" onClick={closeAddRoleModal} className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200">
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createCategory.isPending}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                            >
                                {createCategory.isPending ? 'Creating...' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}