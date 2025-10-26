import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import * as api from '../../lib/api';
// MODIFIED: Added DialogTitle and DialogFooter
import { Button, Card, CardHeader, CardContent, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogCloseButton } from '../ui';

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

export default function CustomerManagementPage({ reload }) {
    const customers = useStore(s => s.customers);
    const addToast = useStore(s => s.addToast);

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const openModal = () => {
        resetForm();
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setTimeout(resetForm, 200);
    };

    const startEdit = (c) => {
        setEditing(c);
        setName(c?.name || '');
        setEmail(c?.email || '');
        setPhone(c?.phone || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setEmail('');
        setPhone('');
    };

    const save = async (e) => {
        e.preventDefault();
        if (!name) { // Email is optional now
            addToast({ title: 'Error', description: 'Customer Name is required.' });
            return;
        }

        const payload = { name, email, phone };

        try {
            if (editing) {
                await api.updateItem('customers', editing.id, payload);
                addToast({ title: 'Updated', description: `Customer ${name} updated` });
            } else {
                // Ensure dateAdded is included for creation
                await api.createCustomer({ ...payload, dateAdded: new Date().toISOString() });
                addToast({ title: 'Created', description: `Customer ${name} created` });
            }
            closeModal();
            if (reload) reload(); // Use the reload prop from _app.js
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to save customer' });
        }
    };

    const remove = async (c) => {
        if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
        try {
            await api.deleteItem('customers', c.id);
            addToast({ title: 'Deleted', description: `${c.name} deleted` });
            if (reload) reload(); // Use the reload prop from _app.js
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to delete customer' });
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Customer Management</h1>
                    <p className="text-muted">Manage your customer records</p>
                </div>
                <Button onClick={openModal}>Add Customer</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search customers..." className="w-full" />
            </div>

            <Card className="mb-4">
                <CardContent>
                    <ScrollArea className="max-h-96"> {/* Adjust max height */}
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact Number</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.name}</TableCell>
                                        <TableCell>{c.email || 'N/A'}</TableCell>
                                        <TableCell>{c.phone || 'N/A'}</TableCell>
                                        <TableCell>{c.dateAdded ? c.dateAdded.toLocaleDateString() : 'N/A'}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-1"> {/* Reduced space */}
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}> {/* Smaller icons */}
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c)}> {/* Smaller icons */}
                                                    <DeleteIcon />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                        {customers.length === 0 && (
                            <p className="p-4 text-center text-muted">No customers found.</p>
                        )}
                    </ScrollArea>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Customer' : 'Add Customer'}</DialogTitle>
                        <DialogCloseButton onClick={closeModal} />
                    </DialogHeader>
                    <form onSubmit={save}>
                        <div className="p-4 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label htmlFor="customerName">Customer Name</Label>
                                    <Input id="customerName" value={name} onChange={e => setName(e.target.value)} required />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email (Optional)</Label>
                                    <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                                </div>
                                <div>
                                    <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
                                    <Input id="contactNumber" value={phone} onChange={e => setPhone(e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeModal}>Cancel</Button>
                            <Button type="submit">Save Customer</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}