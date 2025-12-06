// src/components/pages/UserManagementPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton,
    Select
} from '../ui';

import Pagination from '../Pagination';
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser
} from '../../hooks/useUserMutations';

import { EditIcon, DeleteIcon, UserIcon as StaffIcon } from '../Icons';

// --- Constants ---
const USER_ROLES = {
    STAFF: 'Staff',
    ADMIN: 'Admin',
};

// --- Helper for Role Badge ---
const RoleBadge = ({ role }) => {
    const isAdmin = role === USER_ROLES.ADMIN;
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
        }`}>
            {isAdmin ? 'Admin' : 'Staff'}
        </span>
    );
};

// --- Icons for Input Fields ---
const UserInputIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zM8 11a4 4 0 00-4 4v.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V15a4 4 0 00-4-4H8z" clipRule="evenodd" />
    </svg>
);

const MailIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
);

const LockIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" clipRule="evenodd" />
    </svg>
);

const BriefcaseIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
        <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
    </svg>
);

export default function UserManagementPage() {
    const addToast = useStore(s => s.addToast);
    const { user: currentUser, isDemo } = useStore(s => ({
        user: s.user,
        isDemo: s.user?.isDemo
    }));

    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    // --- State ---
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState(USER_ROLES.STAFF);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: usersData = { users: [], totalPages: 1 }, isLoading } = useUsers({ page: currentPage, itemsPerPage, searchTerm });
    const users = usersData.users;
    const totalPages = usersData.totalPages;
    const searchInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isModalOpen) {
                closeModal();
                return;
            }
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isModalOpen]);

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
        setRole(u?.role || USER_ROLES.STAFF);
        setPassword('');
        setConfirmPassword('');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setEmail('');
        setRole(USER_ROLES.STAFF);
        setPassword('');
        setConfirmPassword('');
    };

    const save = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            addToast({ title: 'Error', description: "Passwords do not match.", variant: 'destructive' });
            return;
        }
        if (!name || !email) {
            addToast({ title: 'Error', description: "Name and Email are required.", variant: 'destructive' });
            return;
        }
        if (!editing && !password) {
            addToast({ title: 'Error', description: "Password is required for new users.", variant: 'destructive' });
            return;
        }

        const payload = { name, email, role };
        if (password) {
            payload.password = password;
        }

        try {
            if (editing) {
                if (editing.id === currentUser?.id && role !== USER_ROLES.ADMIN) {
                    if (!confirm("Warning: You are removing your own Admin privileges. You may lose access to this page. Proceed?")) {
                        return;
                    }
                }
                await updateUser.mutateAsync({ ...payload, id: editing.id });
            } else {
                await createUser.mutateAsync(payload);
            }
            closeModal();
        } catch (e) {
            console.error(e);
        }
    };

    const remove = async (u) => {
        if (u.id === currentUser?.id) {
            addToast({ title: 'Cannot Delete Self', description: 'You cannot delete your own account.', variant: 'destructive' });
            return;
        }
        if (!confirm(`Delete ${u.name}? This action cannot be undone.`)) return;

        try {
            await deleteUser.mutateAsync(u.id);
        } catch (e) {
            console.error(e);
        }
    };

    const isMutating = createUser.isPending || updateUser.isPending || deleteUser.isPending;

    return (
        <div className="user-page">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">User Management</h1>
                        <p className="text-muted mt-1">Add, edit, or remove staff and admin accounts</p>
                    </div>
                    <Button onClick={openModal} variant="primary" disabled={isDemo}>Add User</Button>
                </div>

                <div className="mb-4">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search by name, email, or role..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs mb-2"
                    />
                </div>

                {/* --- DESKTOP TABLE --- */}
                <Card className="mb-4 hidden md:block">
                    <CardContent className="p-0">
                        <ScrollArea className="max-h-[calc(100vh-280px)]">
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted py-8">Loading users...</TableCell>
                                        </TableRow>
                                    ) : users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-muted py-8">No users found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map(u => (
                                            <TableRow key={u.id}>
                                                <TableCell className="font-medium">
                                                    {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-400">(You)</span>}
                                                </TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>
                                                    <RoleBadge role={u.role} />
                                                </TableCell>
                                                <TableCell>
                                                    {u.dateAdded instanceof Date && !isNaN(u.dateAdded)
                                                        ? u.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo}>
                                                            <EditIcon />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => remove(u)} title="Delete User" disabled={isDemo || u.id === currentUser?.id}>
                                                            <DeleteIcon />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- MOBILE LIST VIEW --- */}
                <div className="block md:hidden">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="text-center text-muted p-6">Loading users...</div>
                            ) : users.length === 0 ? (
                                <div className="text-center text-muted p-6">No users found.</div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <div key={u.id} className="p-4 flex items-center space-x-3">
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <StaffIcon />
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-400">(You)</span>}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">{u.email}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    <RoleBadge role={u.role} />
                                                </div>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(u)} title="Delete User" disabled={isDemo || u.id === currentUser?.id}>
                                                    <DeleteIcon />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                {/* --- MODAL: Add/Edit User (Corrected & Replicated from Customer Page) --- */}
                <Dialog
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    className="flex items-center justify-center"
                >
                    <DialogContent
                        className="p-0 w-full sm:max-w-xl bg-white shadow-xl border border-gray-100 flex flex-col"
                        style={{ backgroundColor: '#ffffff', zIndex: 50, maxHeight: '85vh' }}
                    >
                        <form
                            onSubmit={save}
                            className="flex flex-col flex-1 min-h-0"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            {/* Header */}
                            <DialogHeader
                                className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <DialogTitle className="text-lg font-bold text-gray-900">
                                    {editing ? 'Edit User' : 'Add New User'}
                                </DialogTitle>
                                <DialogCloseButton onClick={closeModal} />
                            </DialogHeader>

                            {/* Scrollable Body */}
                            <div
                                className="flex-1 overflow-y-auto px-6 py-6"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <div className="space-y-6">

                                    {/* --- Section 1: Account --- */}
                                    <div className="space-y-5">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                                            Account Details
                                        </h3>

                                        {/* Full Name */}
                                        <div className="space-y-1.5">
                                            <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                                Full Name <span className="text-red-500">*</span>
                                            </Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                    <UserInputIcon className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    id="name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                    autoFocus
                                                    placeholder="Enter full name"
                                                    className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Email */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                                    Email <span className="text-red-500">*</span>
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                        <MailIcon className="w-5 h-5" />
                                                    </div>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        required
                                                        placeholder="email@example.com"
                                                        className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                    />
                                                </div>
                                            </div>

                                            {/* Role */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                                                    User Role
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                        <BriefcaseIcon className="w-5 h-5" />
                                                    </div>
                                                    <Select
                                                        id="role"
                                                        value={role}
                                                        onChange={(e) => setRole(e.target.value)}
                                                        className="w-full text-base pl-11 py-2.5 border-gray-300 h-11 appearance-none"
                                                    >
                                                        <option value={USER_ROLES.STAFF}>Staff</option>
                                                        <option value={USER_ROLES.ADMIN}>Admin</option>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* --- Section 2: Security --- */}
                                    <div className="space-y-5 pt-2">
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">
                                            {editing ? 'Change Password (Optional)' : 'Security'}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            {/* Password */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                                    Password {!editing && <span className="text-red-500">*</span>}
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                        <LockIcon className="w-5 h-5" />
                                                    </div>
                                                    <Input
                                                        id="password"
                                                        type="password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        required={!editing}
                                                        placeholder="••••••••"
                                                        className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                    />
                                                </div>
                                            </div>

                                            {/* Confirm Password */}
                                            <div className="space-y-1.5">
                                                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                                                    Confirm Password {!editing && <span className="text-red-500">*</span>}
                                                </Label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                        <LockIcon className="w-5 h-5" />
                                                    </div>
                                                    <Input
                                                        id="confirmPassword"
                                                        type="password"
                                                        value={confirmPassword}
                                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                                        required={!editing}
                                                        placeholder="••••••••"
                                                        className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Mobile Spacer */}
                                    <div className="h-4 md:hidden"></div>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter
                                className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10"
                                style={{ backgroundColor: '#f9fafb' }}
                            >
                                <div className="flex w-full justify-end gap-3">
                                    <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="px-6 bg-white border-gray-300">
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isMutating} className="px-6 btn--primary">
                                        {isMutating ? 'Saving...' : (editing ? 'Update User' : 'Create User')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}