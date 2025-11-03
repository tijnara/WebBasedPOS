import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';

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
    const [address, setAddress] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const searchInputRef = useRef(null);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const activeTag = document.activeElement.tagName;
            if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;
            if ((e.ctrlKey && e.key === 'f') || e.key === '/') {
                if (searchInputRef.current) searchInputRef.current.focus();
                e.preventDefault();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

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
        setEmail(c?.email === 'N/A' ? '' : c?.email || '');
        setPhone(c?.phone === 'N/A' ? '' : c?.phone || '');
        setAddress(c?.address || '');
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditing(null);
        setName('');
        setEmail('');
        setPhone('');
        setAddress('');
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
            address: address.trim() || null,
        };

        try {
            if (editing) {
                await updateCustomer.mutateAsync({ ...payload, id: editing.id, dateAdded: editing.dateAdded });
                addToast({ title: 'Updated', description: `Customer ${name} updated`, variant: 'success' });
            } else {
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

    const isMutating = createCustomer.isPending || updateCustomer.isPending || deleteCustomer.isPending;

    // Filter customers by searchTerm (case-insensitive, name, email, or phone)
    const filteredCustomers = customers.filter(c => {
        const term = searchTerm.trim().toLowerCase();
        if (!term) return true;
        return (
            (c.name && c.name.toLowerCase().includes(term)) ||
            (c.email && c.email.toLowerCase().includes(term)) ||
            (c.phone && c.phone.toLowerCase().includes(term))
        );
    });
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="customer-page">
            {/* --- Brand Logo at the very top left --- */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} />
            <MobileLogoutButton />
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Customer Management</h1>
                        <p className="text-muted mt-1">Manage your customer records</p>
                    </div>
                    <Button onClick={openModal} variant="primary">Add Customer</Button>
                </div>
<br/>
                <div className="mb-4 mt-6">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search by name, email, or phone..."
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
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Contact Number</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead>Staff</TableHead> {/* <-- ADDED COLUMN */}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted py-8">Loading customers...</TableCell>
                                        </TableRow>
                                    ) : paginatedCustomers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted py-8">No customers found.</TableCell>
                                        </TableRow>
                                    ) : (
                                        paginatedCustomers.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>{c.email}</TableCell>
                                                <TableCell>{c.phone}</TableCell>
                                                <TableCell>
                                                    {c.dateAdded instanceof Date && !isNaN(c.dateAdded)
                                                        ? c.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>{c.createdBy || 'N/A'}</TableCell> {/* <-- ADDED CELL */}
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
                        {/* Pagination Controls */}
                        <div className="flex justify-center items-center gap-2 py-4 px-4 rounded-lg bg-white">
                            <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                            <span className="text-sm">Page {currentPage} of {totalPages}</span>
                            <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* --- MOBILE CARD LIST (Show on mobile, hide on md+) --- */}
                <div className="block md:hidden space-y-3">
                    {isLoading ? (
                        <div className="text-center text-muted py-8">Loading customers...</div>
                    ) : paginatedCustomers.length === 0 ? (
                        <div className="text-center text-muted py-8">No customers found.</div>
                    ) : (
                        paginatedCustomers.map(c => (
                            <Card key={c.id}>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start">
                                        {/* Customer Info */}
                                        <div className="pr-2 space-y-0.5">
                                            <h3 className="font-semibold text-lg">{c.name}</h3>
                                            <p className="text-sm text-muted truncate">{c.email}</p>
                                            <p className="text-sm text-muted">{c.phone}</p>
                                            <p className="text-sm text-muted">Staff: {c.createdBy || 'N/A'}</p> {/* <-- ADDED STAFF */}
                                        </div>
                                        {/* Action Buttons */}
                                        <div className="flex flex-col space-y-1 flex-shrink-0">
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(c)} title="Edit Customer">
                                                <EditIcon />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(c)} title="Delete Customer">
                                                <DeleteIcon />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                    {/* Pagination Controls for mobile */}
                    <div className="flex justify-center items-center gap-2 py-4 px-4 rounded-lg bg-white">
                        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>Prev</Button>
                        <span className="text-sm">Page {currentPage} of {totalPages}</span>
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next</Button>
                    </div>
                </div>

                {/* --- MODAL: Customer Form (No change needed) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editing ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
                            <DialogCloseButton onClick={closeModal} />
                        </DialogHeader>
                        <form onSubmit={save}>
                            <div className="p-4 space-y-4">
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
            </div>
        </div>
    );
}