import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
// Removed: import * as api from '../../lib/api';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';

// --- NEW: Import all the hooks ---
import {
    useUsers,
    useCreateUser,
    useUpdateUser,
    useDeleteUser
} from '../../hooks/useUserMutations'; // Assuming you created this file

// Simple SVG Icon for Edit
const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
    </svg>
);

// Simple SVG Icon for Delete
const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
        <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
    </svg>
);


export default function UserManagementPage() {
    const addToast = useStore(s => s.addToast);

    // --- REFACTORED: Get data from useUsers hook ---
    const { data: users = [], isLoading } = useUsers();

    // --- NEW: Initialize mutations ---
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();

    // State for the modal
    const [editing, setEditing] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Removed: loadData and useEffect

    const startEdit = (u) => {
        setEditing(u);
        setFullName(u?.name || '');
        setEmail(u?.email || '');
        setContactNumber(u?.phone || '');
        setPassword(''); // Always clear password for edit form
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setFullName('');
        setEmail('');
        setPassword('');
        setContactNumber('');
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(resetForm, 200); // Delay reset to allow modal animation
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const save = async (e) => {
        e.preventDefault();

        if (!fullName || !email) { // Contact number is optional based on User hook
            addToast({ title: 'Error', description: 'Fullname and Email are required.', variant: 'destructive' });
            return;
        }
        if (!editing && !password) {
            addToast({ title: 'Error', description: 'Password is required for new users.', variant: 'destructive' });
            return;
        }

        const payload = {
            name: fullName, // Mapped to first_name in the hook
            email,
            phone: contactNumber,
            ...(password && { password }),
        };

        try {
            if (editing) {
                await updateUser.mutateAsync({ ...payload, id: editing.id });
                addToast({ title: 'Updated', description: `User ${email} updated`, variant: 'success' });
            } else {
                await createUser.mutateAsync(payload);
                addToast({ title: 'Created', description: `User ${email} created`, variant: 'success' });
            }
            closeModal();
            // No loadData() needed, hooks invalidate the query
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to save user', variant: 'destructive' });
        }
    };

    const remove = async (u) => {
        if (!confirm(`Are you sure you want to delete ${u.email}? This cannot be undone.`)) return;
        try {
            await deleteUser.mutateAsync(u.id);
            addToast({ title: 'Deleted', description: `${u.email} deleted`, variant: 'success' });
            // No loadData() needed
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to delete user', variant: 'destructive' });
        }
    };

    const isMutating = createUser.isPending || updateUser.isPending || deleteUser.isPending;

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">User Management</h1>
                    <p className="text-muted">Manage your staff accounts</p>
                </div><Button variant="primary" onClick={openModal}>Add User</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search users..." className="w-full" />
            </div>

            <Card className="mb-4">
                <CardContent>
                    <ScrollArea className="max-h-96"> {/* Adjust max height */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fullname</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact Number</TableHead>
                                    {/* <TableHead>Role</TableHead> Optionally add role */}
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* --- REFACTORED: Show loading state --- */}
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted">Loading users...</TableCell>
                                    </TableRow>
                                ) : users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center text-muted">No users found.</TableCell>
                                    </TableRow>
                                ) : (
                                    users.map(u => (
                                        <TableRow key={u.id}>
                                            <TableCell>{u.name}</TableCell>
                                            <TableCell>{u.email}</TableCell>
                                            <TableCell>{u.phone || 'N/A'}</TableCell>
                                            {/* <TableCell>{u.role?.name || 'N/A'}</TableCell> Optionally add role */}
                                            <TableCell>
                                                <div className="flex space-x-1"> {/* Reduced space */}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(u)}> {/* Smaller icons */}
                                                        <EditIcon />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(u)}> {/* Smaller icons */}
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
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit User' : 'Add User'}</DialogTitle>
                        <DialogCloseButton onClick={closeModal} />
                    </DialogHeader>
                    <form onSubmit={save}>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="fullname">Fullname</Label>
                                    <Input id="fullname" value={fullName} onChange={e => setFullName(e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editing ? "Leave blank to keep current" : ""} required={!editing} />
                                </div>
                                <div>
                                    <Label htmlFor="contactNumber">Contact Number (Optional)</Label> {/* Changed from required */}
                                    <Input id="contactNumber" value={contactNumber} onChange={e => setContactNumber(e.target.value)} />
                                </div>
                                {/* Add Role Selection Here if needed */}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating}>Cancel</Button>
                            <Button type="submit" disabled={isMutating}>
                                {isMutating ? 'Saving...' : 'Save User'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}