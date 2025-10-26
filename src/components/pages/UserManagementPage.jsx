import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
import { Button, Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label } from '../ui';

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

const apiUrl = 'http://localhost:8055/items/users';

export default function UserManagementPage() {
    const addToast = useStore(s => s.addToast);
    const [users, setUsers] = useState([]);
    const [editing, setEditing] = useState(null);
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const loadData = async () => {
        try {
            const response = await fetch(apiUrl);
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            setUsers(data.data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                dateAdded: new Date(user.dateAdded).toLocaleString(),
            })));
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: 'Failed to load users' });
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const startEdit = (u) => {
        setEditing(u);
        setFullName(u?.name || '');
        setEmail(u?.email || '');
        setContactNumber(u?.phone || '');
        setPassword(''); // Clear password field for editing
    };

    const resetForm = () => {
        setEditing(null);
        setFullName('');
        setEmail('');
        setPassword('');
        setContactNumber('');
    };

    const save = async (e) => {
        e.preventDefault();

        const payload = {
            name: fullName,
            email,
            phone: contactNumber,
            password
        };

        if (!editing && !password) {
            addToast({ title: 'Error', description: 'Password is required for new users.' });
            return;
        }
        if (!contactNumber) {
            addToast({ title: 'Error', description: 'Contact number is required.' });
            return;
        }

        try {
            if (editing) {
                await updateUser(editing.id, payload);
                addToast({ title: 'Updated', description: `User ${email} updated` });
            } else {
                await addUser(payload);
                addToast({ title: 'Created', description: `User ${email} created` });
            }
            resetForm();
            loadData(); // Reload users list
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message });
        }
    };

    const remove = async (u) => {
        if (!confirm(`Delete ${u.email}?`)) return;
        try {
            await api.deleteUser(u.id);
            addToast({ title: 'Deleted', description: `${u.email} deleted` });
            loadData(); // Reload users list
        } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
    };

    const addUser = async (user) => {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: [user] }),
            });
            if (!response.ok) throw new Error('Failed to add user');
            loadData();
            addToast({ title: 'Success', description: 'User added successfully' });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: 'Failed to add user' });
        }
    };

    const updateUser = async (id, updatedData) => {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: updatedData }),
            });
            if (!response.ok) throw new Error('Failed to update user');
            loadData();
            addToast({ title: 'Success', description: 'User updated successfully' });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: 'Failed to update user' });
        }
    };

    const deleteUser = async (id) => {
        try {
            const response = await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Failed to delete user');
            loadData();
            addToast({ title: 'Success', description: 'User deleted successfully' });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: 'Failed to delete user' });
        }
    };

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">User Management</h1>
                    <p className="text-muted">Manage your staff accounts</p>
                </div>
                <Button onClick={openModal}>Add User</Button>
            </div>

            <Card className="mb-4">
                <CardContent>
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fullname</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact Number</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map(u => (
                                    <TableRow key={u.id}>
                                        <TableCell>{u.name}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.phone}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(u)}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => remove(u)} className="text-destructive">
                                                    <DeleteIcon />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                </CardContent>
            </Card>

            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content">
                        <Card>
                            <CardHeader><h3 className="font-semibold">{editing ? 'Edit User' : 'Add User'}</h3></CardHeader>
                            <CardContent>
                                <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={editing ? "Leave blank to keep unchanged" : ""} />
                                    </div>
                                    <div>
                                        <Label htmlFor="contactNumber">Contact Number</Label>
                                        <Input id="contactNumber" value={contactNumber} onChange={e => setContactNumber(e.target.value)} required />
                                    </div>
                                    <div className="md:col-span-2 flex space-x-2">
                                        <Button type="submit">Save</Button>
                                        <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}
