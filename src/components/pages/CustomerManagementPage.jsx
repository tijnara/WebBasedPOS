import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';

// --- Import Customer Hooks ---
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
import {
    useCustomers,
    useUpdateCustomer,
    useDeleteCustomer
} from '../../hooks/useCustomerMutations';

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

export default function CustomerManagementPage() {
    const { data: customers = [], isLoading } = useCustomers();
    const addToast = useStore(s => s.addToast);

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();
    const deleteCustomer = useDeleteCustomer();

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState(''); // State for address
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
        setEmail(c?.email === 'N/A' ? '' : c?.email || ''); // Handle 'N/A'
        setPhone(c?.phone === 'N/A' ? '' : c?.phone || ''); // Handle 'N/A'
        setAddress(c?.address || ''); // Set address for editing
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setEmail('');
        setPhone('');
        setAddress(''); // Reset address field
    };

    const save = async (e) => {
        e.preventDefault();
        if (!name || !name.trim()) {
            addToast({ title: 'Error', description: 'Customer Name is required.', variant: 'destructive' });
            return;
        }

        const payload = {
            name: name.trim(),
            email: email.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null, // Include address
            // 'dateAdded' is no longer sent; hook uses 'created_at' from Supabase
        };

        try {
            if (editing) {
                // Pass the existing dateAdded from the 'editing' object if needed
                await updateCustomer.mutateAsync({ ...payload, id: editing.id, dateAdded: editing.dateAdded });
                addToast({ title: 'Updated', description: `Customer ${name} updated`, variant: 'success' });
            } else {
                // dateAdded/created_at is handled by Supabase/hook
                await createCustomer.mutateAsync(payload);
                addToast({ title: 'Created', description: `Customer ${name} created`, variant: 'success' });
            }
            closeModal();
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to save customer', variant: 'destructive' });
        }
    };

    const remove = async (c) => {
        if (!confirm(`Delete ${c.name}? This cannot be undone.`)) return;
        try {
            await deleteCustomer.mutateAsync(c.id);
            addToast({ title: 'Deleted', description: `${c.name} deleted`, variant: 'success' });
        } catch (e) {
            console.error(e);
            addToast({ title: 'Error', description: e.message || 'Failed to delete customer', variant: 'destructive' });
        }
    };

    // Combined mutation loading state
    const isMutating = createCustomer.isPending || updateCustomer.isPending || deleteCustomer.isPending;

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-2">
                <div>
                    <h1 className="text-2xl font-semibold">Customer Management</h1>
                    <p className="text-muted mt-1">Manage your customer records</p>
                </div>
                <Button onClick={openModal} variant="primary">Add Customer</Button>
            </div>

            <div className="mb-4">
                <Input placeholder="Search customers..." className="w-full max-w-lg" />
            </div>

            <Card className="mb-4">
                <CardContent className="p-0">
                    <ScrollArea className="max-h-[calc(100vh-280px)]">
                        <Table>
                            <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                <TableRow>
                                    <TableHead>Customer Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Contact Number</TableHead>
                                    <TableHead>Date Added</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted py-8">Loading customers...</TableCell>
                                    </TableRow>
                                ) : customers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted py-8">No customers found.</TableCell>
                                    </TableRow>
                                ) : (
                                    customers.map(c => (
                                        <TableRow key={c.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{c.name}</TableCell>
                                            <TableCell>{c.email}</TableCell>
                                            <TableCell>{c.phone}</TableCell>
                                            {/* FIX: Use dateAdded from the mapped hook data */}
                                            <TableCell>
                                                {c.dateAdded instanceof Date && !isNaN(c.dateAdded)
                                                    ? c.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                    : 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(c)} title="Edit Customer">
                                                        <EditIcon />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => remove(c)} title="Delete Customer">
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

            {/* --- MODAL: Customer Form --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                        <DialogCloseButton onClick={closeModal} />
                    </DialogHeader>
                    <form onSubmit={save}>
                        <div className="p-4 space-y-4">
                            {/* Form grid layout */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="sm:col-span-2">
                                    <Label htmlFor="name">Customer Name <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        placeholder="Enter full name"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email (Optional)</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="customer@example.com"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone">Phone (Optional)</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="e.g., 09171234567"
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <Label htmlFor="address">Address (Optional)</Label>
                                    <Input
                                        id="address"
                                        value={address}
                                        onChange={(e) => setAddress(e.target.value)}
                                        placeholder="123 Main St, City"
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating}>Cancel</Button>
                            <Button type="submit" variant="primary" disabled={isMutating}>
                                {isMutating ? 'Saving...' : (editing ? 'Update Customer' : 'Create Customer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            {/* --- END MODAL --- */}
        </div>
    );
}