import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';
import MobileLogoutButton from '../MobileLogoutButton';
import Pagination from '../Pagination';

// --- Import Customer Hooks ---
import { useCreateCustomer } from '../../hooks/useCreateCustomer';
// --- MODIFICATION: Fixed imports ---
import {
    useUpdateCustomer,
    useDeleteCustomer
} from '../../hooks/useCustomerMutations';
import { useCustomers } from '../../hooks/useCustomers';
// --- END MODIFICATION ---

// --- NEW: Simple SVG Icon for Customer (User Circle) ---
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className="text-gray-500">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zM8 11a4 4 0 00-4 4v.5a.5.5 0 00.5.5h11a.5.5 0 00.5-.5V15a4 4 0 00-4-4H8z" clipRule="evenodd" />
    </svg>
);

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
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    // Pass page, itemsPerPage, and debouncedSearchTerm to useCustomers
    const { data: customersData = { customers: [], totalPages: 1 }, isLoading } = useCustomers({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm });
    const customers = customersData.customers;
    const totalPages = customersData.totalPages;
    const addToast = useStore(s => s.addToast);
    const isDemo = useStore(s => s.user?.isDemo); // <-- FIX: define isDemo

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();
    const deleteCustomer = useDeleteCustomer();

    const [editing, setEditing] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    // const [searchTerm, setSearchTerm] = useState(''); // Moved up
    // const [currentPage, setCurrentPage] = useState(1);
    // const itemsPerPage = 10;
    const searchInputRef = useRef(null);

    // --- MODIFICATION: Debounce search term ---
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300); // 300ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm]);
    // --- END MODIFICATION ---

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

    // --- MODIFICATION: Remove client-side filtering ---
    // const filteredCustomers = customers; // Data from useCustomers is already filtered
    // --- END MODIFICATION ---

    // const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    // const paginatedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="customer-page">
            {/* --- Brand Logo at the very top left --- */}
            <img src="/seaside.png" alt="Seaside Logo" className="brand-logo-top" width={32} height={32} loading="lazy" />
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
                        placeholder="Search by name, email, phone, or staff..." // Updated placeholder
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs mb-2"
                    />
                </div>

                {/* --- DESKTOP TABLE (Hidden on mobile) --- */}
                <Card className="mb-4 hidden md:block">
                    <CardContent className="p-0">
                        {/* --- MODIFICATION: Removed max-h, pagination handles length --- */}
                        <ScrollArea>
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                    <TableRow>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Contact Number</TableHead>
                                        <TableHead>Date Added</TableHead>
                                        <TableHead>Staff</TableHead> {/* --- ADDED --- */}
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            {/* --- MODIFICATION: Added loading spinner --- */}
                                            <TableCell colSpan={6} className="text-center text-muted py-8">
                                                <div className="flex justify-center items-center">
                                                    <svg className="animate-spin h-5 w-5 text-primary mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Loading customers...
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : customers.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted py-8">
                                                {debouncedSearchTerm ? `No customers found for "${debouncedSearchTerm}".` : 'No customers found.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        customers.map(c => (
                                            <TableRow key={c.id}>
                                                <TableCell className="font-medium">{c.name}</TableCell>
                                                <TableCell>{c.email}</TableCell>
                                                <TableCell>{c.phone}</TableCell>
                                                <TableCell>
                                                    {c.dateAdded instanceof Date && !isNaN(c.dateAdded)
                                                        ? c.dateAdded.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
                                                        : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {c.users?.name
                                                        ? c.users.name
                                                        : c.created_by === 99999
                                                            ? 'Demo User'
                                                            : 'N/A'}
                                                </TableCell> {/* --- Staff name cell --- */}
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => startEdit(c)} title="Edit Customer" disabled={isDemo}>
                                                            <EditIcon />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => remove(c)} title="Delete Customer" disabled={isDemo}>
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
                                <div className="text-center text-muted p-6">Loading customers...</div>
                            ) : customers.length === 0 ? (
                                <div className="text-center text-muted p-6">
                                    {debouncedSearchTerm ? `No customers found for "${debouncedSearchTerm}".` : 'No customers found.'}
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {customers.map(c => (
                                        <div key={c.id} className="p-4 flex items-center space-x-3">
                                            {/* Icon */}
                                            <div className="flex-shrink-0">
                                                <span className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                                                    <UserIcon />
                                                </span>
                                            </div>

                                            {/* Customer Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 truncate">{c.name}</div>
                                                <div className="text-sm text-gray-500 truncate">{c.email || 'No email'}</div>
                                                <div className="text-xs text-gray-400 truncate">
                                                    Staff: {c.users?.name || (c.created_by === 99999 ? 'Demo User' : 'N/A')}
                                                </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex-shrink-0 flex items-center space-x-0">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => startEdit(c)} title="Edit Customer" disabled={isDemo}>
                                                    <EditIcon />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(c)} title="Delete Customer" disabled={isDemo}>
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

                {/* --- MODAL: Customer Form (No change needed) --- */}
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                    <DialogContent
                        className="p-0 overflow-hidden max-h-[calc(100dvh-2rem)] sm:max-w-xl bg-white shadow-xl border border-gray-100"
                        style={{ backgroundColor: '#ffffff', zIndex: 50 }}
                    >
                        <form
                            onSubmit={save}
                            className="flex flex-col h-full max-h-[calc(100dvh-2rem)] bg-white"
                            style={{ backgroundColor: '#ffffff' }}
                        >
                            {/* Header */}
                            <DialogHeader
                                className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <DialogTitle className="text-lg font-bold text-gray-900">
                                    {editing ? 'Edit Customer' : 'Add New Customer'}
                                </DialogTitle>
                                <DialogCloseButton onClick={closeModal} />
                            </DialogHeader>

                            {/* Scrollable Body */}
                            <div
                                className="flex-1 overflow-y-auto px-6 py-6 space-y-6 modal-scroll modal-scrollbar bg-white"
                                style={{ minHeight: '0', backgroundColor: '#ffffff' }}
                            >
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {/* Customer Name - Full Width */}
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                            Customer Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            placeholder="Enter full name"
                                            autoFocus
                                            className="text-base py-2.5"
                                        />
                                    </div>

                                    {/* Email and Phone */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                            Email (Optional)
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="customer@example.com"
                                            className="text-base py-2.5"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                                            Phone (Optional)
                                        </Label>
                                        <Input
                                            id="phone"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            placeholder="e.g., 09171234567"
                                            className="text-base py-2.5"
                                        />
                                    </div>

                                    {/* Address - Full Width */}
                                    <div className="sm:col-span-2 space-y-1.5">
                                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">
                                            Address (Optional)
                                        </Label>
                                        <Input
                                            id="address"
                                            value={address}
                                            onChange={(e) => setAddress(e.target.value)}
                                            placeholder="123 Main St, City"
                                            className="text-base py-2.5"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <DialogFooter
                                className="px-6 py-4 border-t bg-gray-50 flex-shrink-0"
                                style={{ backgroundColor: '#f9fafb' }}
                            >
                                <div className="flex w-full justify-end gap-3">
                                    <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="px-6">
                                        Cancel
                                    </Button>
                                    <Button type="submit" variant="primary" disabled={isMutating} className="px-6 btn--primary">
                                        {isMutating ? 'Saving...' : (editing ? 'Update Customer' : 'Create Customer')}
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

