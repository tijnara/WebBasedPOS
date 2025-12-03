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

// --- Constants (Must match Postgres Enum exactly) ---
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
        setRole(u?.role || USER_ROLES.STAFF); // Now correctly pulls role from hook
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

        // --- Include Role in Payload ---
        const payload = { name, email, role };
        if (password) {
            payload.password = password;
        }

        try {
            if (editing) {
                // Removed the block that prevented editing self.
                // Instead, warn if user is demoting themselves.
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
            // AddToast handled by mutation hook error
        }
    };

    const remove = async (u) => {
        // Still prevent deleting self for safety
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
                                                    {/* Display Role Badge */}
                                                    <RoleBadge role={u.role} />
                                                </TableCell>
                                                <TableCell>
                                                    {u.dateAdded instanceof Date && !isNaN(u.dateAdded)
                                                        ? u.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        {/* Enabled Edit for self */}
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo}>
                                                            <EditIcon />
                                                        </Button>
                                                        {/* Delete still disabled for self */}
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
                        {/* Pagination Controls */}
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
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <StaffIcon />
                                                </span>
                                            </div>

                                            {/* User Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">
                                                    {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-400">(You)</span>}
                                                </div>
                                                <div className="text-sm text-gray-500 truncate">{u.email}</div>
                                                <div className="text-xs text-gray-400 mt-1">
                                                    <RoleBadge role={u.role} />
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                {/* Enabled Edit for self */}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo}>
                                                    <EditIcon />
                                                </Button>
                                                {/* Delete still disabled for self */}
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

                    {/* Pagination Controls for mobile */}
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                {/* --- MODAL --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent
                        className="p-0 overflow-hidden w-full sm:max-w-xl bg-white shadow-xl border border-gray-100 relative"
                        style={{ backgroundColor: '#ffffff', zIndex: 50 }}
                    >
                        <form
                            onSubmit={save}
                            className="flex flex-col h-full max-h-[100vh] bg-white"
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
                                className="flex-1 overflow-y-auto px-6 py-6 mb-20 modal-scroll modal-scrollbar bg-white relative"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <div className="space-y-5">
                                    {/* Account Information Section */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                                            Account Information
                                        </h3>

                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                                                Full Name <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                autoFocus
                                                placeholder="Enter full name"
                                                className="text-base py-2.5 border-gray-300 h-11 w-full"
                                            />
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                                                Email Address <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                placeholder="email@example.com"
                                                className="text-base py-2.5 border-gray-300 h-11 w-full"
                                            />
                                        </div>

                                        {/* Role */}
                                        <div className="space-y-2">
                                            <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                                                User Role
                                            </Label>
                                            <Select
                                                id="role"
                                                value={role}
                                                onChange={(e) => setRole(e.target.value)}
                                                className="text-base py-2.5 border-gray-300 h-11 w-full"
                                            >
                                                <option value={USER_ROLES.STAFF}>Staff</option>
                                                <option value={USER_ROLES.ADMIN}>Admin</option>
                                            </Select>
                                        </div>
                                    </div>

                                    {/* Password Section */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                                            {editing ? 'Change Password (Optional)' : 'Set Password'}
                                        </h3>

                                        {/* Password */}
                                        <div className="space-y-2 mb-4">
                                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                                Password {!editing && <span className="text-red-500">*</span>}
                                            </Label>
                                            <Input
                                                id="password"
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required={!editing}
                                                placeholder="••••••••"
                                                className="text-base py-2.5 border-gray-300 h-11 w-full"
                                            />
                                        </div>

                                        {/* Confirm Password */}
                                        <div className="space-y-2">
                                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                                                Confirm Password {!editing && <span className="text-red-500">*</span>}
                                            </Label>
                                            <Input
                                                id="confirmPassword"
                                                type="password"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                required={!editing}
                                                placeholder="••••••••"
                                                className="text-base py-2.5 border-gray-300 h-11 w-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter
                                className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10 absolute bottom-0 left-0 w-full"
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