import React, { useState } from 'react';
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

export default function CustomerManagementPage({ reload }) {
    const customers = useStore(s => s.customers);
    const addToast = useStore(s => s.addToast);

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const startEdit = (c) => {
        setEditing(c);
        setName(c?.name || '');
        setEmail(c?.email || '');
        setPhone(c?.phone || '');
    };

    const save = async (e) => {
        e.preventDefault();
        if (!name || !email) {
            addToast({ title: 'Error', description: 'Name and Email are required.' });
            return;
        }

        const payload = { name, email, phone };

        try {
            if (editing) {
                await api.updateItem('customers', editing.id, payload);
                addToast({ title: 'Updated', description: `Customer ${name} updated` });
            } else {
                await api.createCustomer({ ...payload, dateAdded: new Date().toISOString() });
                addToast({ title: 'Created', description: `Customer ${name} created` });
            }
            setEditing(null); setName(''); setEmail(''); setPhone('');
            if (reload) reload();
        } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
    };

    const remove = async (c) => {
        if (!confirm(`Delete ${c.name}?`)) return;
        try {
            await api.deleteItem('customers', c.id);
            addToast({ title: 'Deleted', description: `${c.name} deleted` });
            if (reload) reload();
        } catch (e) { console.error(e); addToast({ title: 'Error', description: e.message }); }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h1 className="text-2xl font-semibold">Customers</h1>
                    <p className="text-muted">Manage your customer database</p>
                </div>
                <Button onClick={() => startEdit(null)}>Add Customer</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search customers..." className="w-full" />
            </div>

            <Card>
                <CardContent>
                    <ScrollArea className="max-h-96">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map(c => (
                                    <TableRow key={c.id}>
                                        <TableCell>{c.name}</TableCell>
                                        <TableCell>{c.email || '-'}</TableCell>
                                        <TableCell>{c.phone || '-'}</TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => startEdit(c)}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => remove(c)} className="text-destructive">
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

            <div className="mt-4">
                <Card>
                    <CardHeader><h3 className="font-semibold">{editing ? 'Edit Customer' : 'Add Customer'}</h3></CardHeader>
                    <CardContent>
                        <form onSubmit={save} className="space-y-2">
                            <div>
                                <Label htmlFor="cname">Name</Label>
                                <Input id="cname" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="cemail">Email</Label>
                                <Input id="cemail" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                            </div>
                            <div>
                                <Label htmlFor="cphone">Phone</Label>
                                <Input id="cphone" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                            <div className="flex space-x-2">
                                <Button type="submit">Save</Button>
                                <Button variant="outline" type="button" onClick={() => { setEditing(null); setName(''); setEmail(''); setPhone(''); }}>Cancel</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}