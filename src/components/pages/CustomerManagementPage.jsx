// src/components/pages/CustomerManagementPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, ScrollArea, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';

import Pagination from '../Pagination';
import currency from 'currency.js';

// --- Import Customer Hooks ---
import {
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    useRepayDebt // Newly imported
} from '../../hooks/useCustomerMutations';
import { useCustomers } from '../../hooks/useCustomers';

// Import Repayment Modal
import RepaymentModal from '../customers/RepaymentModal';

// --- Icons for UI ---
const UserIcon = ({ className }) => (
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

const PhoneIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
);

const MapPinIcon = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className || "w-5 h-5"}>
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M12.854.146a.5.5 0 0 0-.707 0L10.5 1.793 14.207 5.5l1.647-1.646a.5.5 0 0 0 0-.708l-3-3zm.646 6.061L9.793 2.5 3.293 9H3.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.207l6.5-6.5zm-7.468 7.468A.5.5 0 0 1 6 13.5V13h-.5a.5.5 0 0 1-.5-.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.5-.5V10h-.5a.499.499 0 0 1-.175-.032l-.179.178a.5.5 0 0 0-.11.168l-2 5a.5.5 0 0 0 .65.65l5-2a.5.5 0 0 0 .168-.11l.178-.178z"/>
    </svg>
);

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
    const { data: customersData = { customers: [], totalPages: 1 }, isLoading } = useCustomers({ page: currentPage, itemsPerPage, searchTerm: debouncedSearchTerm });
    const customers = customersData.customers;
    const totalPages = customersData.totalPages;
    const addToast = useStore(s => s.addToast);
    const isDemo = useStore(s => s.user?.isDemo);

    const createCustomer = useCreateCustomer();
    const updateCustomer = useUpdateCustomer();
    const deleteCustomer = useDeleteCustomer();
    const repayDebt = useRepayDebt();

    const [editing, setEditing] = useState(null);
    const [repayCustomer, setRepayCustomer] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const searchInputRef = useRef(null);

    // Debounce search term
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

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

    const handleRepayment = async (id, amount) => {
        try {
            await repayDebt.mutateAsync({ customerId: id, amount });
            setRepayCustomer(null);
        } catch (e) {
            console.error(e);
        }
    };

    const isMutating = createCustomer.isPending || updateCustomer.isPending || deleteCustomer.isPending;

    return (
        <div className="customer-page">
            <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-semibold">Customer Management</h1>
                        <p className="text-muted mt-1">Manage your customer records and credit balances</p>
                    </div>
                    <Button onClick={openModal} variant="primary">Add Customer</Button>
                </div>

                <div className="mb-4 mt-6">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search by name, email, phone, or staff..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full max-w-xs mb-2"
                    />
                </div>

                {/* --- DESKTOP TABLE --- */}
                <Card className="mb-4 hidden md:block">
                    <CardContent className="p-0">
                        <ScrollArea>
                            <Table>
                                <TableHeader className="sticky top-0 bg-gray-50 z-10">
                                    <TableRow>
                                        <TableHead>Customer Name</TableHead>
                                        <TableHead>Contact Number</TableHead>
                                        <TableHead>Address</TableHead>
                                        {/* ADDED: Date Added Column */}
                                        <TableHead>Date Added</TableHead>
                                        {/* FIX: Centered Header for Balance */}
                                        <TableHead className="text-center">Balance (Utang)</TableHead>
                                        {/* FIX: Centered Header for Actions */}
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
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
                                                <TableCell>{c.phone || 'N/A'}</TableCell>
                                                <TableCell className="text-sm text-gray-500 truncate max-w-[200px]" title={c.address}>{c.address || 'N/A'}</TableCell>
                                                {/* ADDED: Display Date Added */}
                                                <TableCell className="text-sm text-gray-500">
                                                    {c.dateAdded ? new Date(c.dateAdded).toLocaleDateString() : '-'}
                                                </TableCell>
                                                {/* FIX: Centered Cell for Balance */}
                                                <TableCell className="text-center font-semibold">
                                                    <span className={c.credit_balance > 0 ? "text-red-600" : "text-green-600"}>
                                                        {currency(c.credit_balance || 0, { symbol: '₱' }).format()}
                                                    </span>
                                                </TableCell>
                                                {/* FIX: Centered Cell and Flex container for Actions */}
                                                <TableCell className="text-center">
                                                    <div className="flex justify-center space-x-1">
                                                        {c.credit_balance > 0 && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-8 text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100 mr-2"
                                                                onClick={() => setRepayCustomer(c)}
                                                            >
                                                                Pay
                                                            </Button>
                                                        )}
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
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={page => setCurrentPage(page)} />
                    </CardContent>
                </Card>

                {/* --- MOBILE LIST VIEW --- */}
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
                                        <div key={c.id} className="p-4 flex flex-col space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="flex-shrink-0">
                                                        <span className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center">
                                                            <UserIcon className="w-6 h-6" />
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{c.name}</div>
                                                        <div className="text-sm text-gray-500">{c.phone || 'No phone'}</div>
                                                    </div>
                                                </div>
                                                <div className={`font-bold ${c.credit_balance > 0 ? "text-red-600" : "text-green-600"}`}>
                                                    {currency(c.credit_balance || 0, { symbol: '₱' }).format()}
                                                </div>
                                            </div>

                                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-50">
                                                {c.credit_balance > 0 && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 text-xs bg-green-50 text-green-700 border-green-200"
                                                        onClick={() => setRepayCustomer(c)}
                                                    >
                                                        Repay Debt
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 bg-blue-50" onClick={() => startEdit(c)}>
                                                    <EditIcon />
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

                {/* --- MODAL: Add/Edit Customer --- */}
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
                            <DialogHeader
                                className="px-6 py-4 border-b bg-white flex-shrink-0 z-10"
                                style={{ backgroundColor: '#ffffff' }}
                            >
                                <DialogTitle className="text-lg font-bold text-gray-900">
                                    {editing ? 'Edit Customer' : 'Add New Customer'}
                                </DialogTitle>
                                <DialogCloseButton onClick={closeModal} />
                            </DialogHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-6" style={{ backgroundColor: '#ffffff' }}>
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                                            Customer Name <span className="text-red-500">*</span>
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <UserIcon className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                required
                                                placeholder="Enter full name"
                                                autoFocus
                                                className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">Email (Optional)</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                    <MailIcon className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    placeholder="example@mail.com"
                                                    className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">Phone (Optional)</Label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                    <PhoneIcon className="w-5 h-5" />
                                                </div>
                                                <Input
                                                    id="phone"
                                                    value={phone}
                                                    onChange={(e) => setPhone(e.target.value)}
                                                    placeholder="0917 123 4567"
                                                    className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="address" className="text-sm font-semibold text-gray-700">Address (Optional)</Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                                                <MapPinIcon className="w-5 h-5" />
                                            </div>
                                            <Input
                                                id="address"
                                                value={address}
                                                onChange={(e) => setAddress(e.target.value)}
                                                placeholder="House No., Street, Barangay, City"
                                                className="w-full text-base pl-11 py-2.5 border-gray-300 h-11"
                                            />
                                        </div>
                                    </div>
                                    <div className="h-4 md:hidden"></div>
                                </div>
                            </div>

                            <DialogFooter className="px-6 py-4 border-t bg-gray-50 flex-shrink-0 z-10" style={{ backgroundColor: '#f9fafb' }}>
                                <div className="flex w-full justify-end gap-3">
                                    <Button variant="outline" type="button" onClick={closeModal} disabled={isMutating} className="px-6 bg-white border-gray-300">Cancel</Button>
                                    <Button type="submit" variant="primary" disabled={isMutating} className="px-6 btn--primary">
                                        {isMutating ? 'Saving...' : (editing ? 'Update Customer' : 'Create Customer')}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* --- MODAL: Repayment --- */}
                {repayCustomer && (
                    <RepaymentModal
                        isOpen={!!repayCustomer}
                        onClose={() => setRepayCustomer(null)}
                        customer={repayCustomer}
                        onRepay={handleRepayment}
                        isMutating={repayDebt.isPending}
                    />
                )}
            </div>
        </div>
    );
}