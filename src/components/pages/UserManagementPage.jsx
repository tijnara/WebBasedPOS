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

// --- NEW: Simple SVG Icon for User (Staff) ---
const StaffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zM8 11a4 4 0 00-4 4v.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V15a4 4 0 00-4-4H8z" clipRule="evenodd" />
    </svg>
);


// Simple SVG Icon for Edit
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
    </svg>
);

// Simple SVG Icon for Delete
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);

// --- Constants ---
const USER_ROLES = {
    STAFF: 'Staff',
    ADMIN: 'Admin',
};

// --- Main Component ---
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

    // --- Modal & Form Handlers ---
    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(resetForm, 200); // Delay for animation
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

    // --- Data Handlers (CRUD) ---
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
                // Prevent editing self (security)
                if (editing.id === currentUser?.id) {
                    addToast({ title: 'Cannot Edit Self', description: 'Please ask another admin to edit your details.', variant: 'destructive' });
                    return;
                }
                await updateUser.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Updated', description: `User ${name} updated`, variant: 'success' });
            } else {
                await createUser.mutateAsync(payload);
                addToast({ title: 'Created', description: `User ${name} created`, variant: 'success' });
            }
            closeModal();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to save user', variant: 'destructive' });
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
            addToast({ title: 'Deleted', description: `${u.name} deleted`, variant: 'success' });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to delete user', variant: 'destructive' });
        }
    };

    const isMutating = createUser.isPending || updateUser.isPending || deleteUser.isPending;

    // --- Render ---
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

                {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
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
                                                <TableCell className="font-medium">{u.name}</TableCell>
                                                <TableCell>{u.email}</TableCell>
                                                <TableCell>{u.role}</TableCell>
                                                <TableCell>
                                                    {u.dateAdded instanceof Date && !isNaN(u.dateAdded)
                                                        ? u.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo || u.id === currentUser?.id}>
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
                        {/* Pagination Controls */}
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- (MODIFIED) MOBILE CARD LIST (Show on mobile, hide on md+) --- */}
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
                                                <div className="font-medium text-gray-900 truncate">{u.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{u.email}</div>
                                                <div className="text-xs text-gray-400">
                                                    Role: <span className="font-medium text-gray-600">{u.role}</span>
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(u)} title="Edit User" disabled={isDemo || u.id === currentUser?.id}>
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

                    {/* Pagination Controls for mobile */}
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                </div>

                {/* --- MODAL: User Form (Fixed UI) --- */}
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