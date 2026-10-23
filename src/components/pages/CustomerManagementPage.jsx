// src/components/pages/CustomerManagementPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useStore } from '../../store/useStore';
import {
    Button, Card, CardContent, Table, TableHeader, TableBody, TableRow,
    TableHead, TableCell, Input, Label, Dialog, DialogContent,
    DialogHeader, DialogTitle, DialogFooter, DialogCloseButton
} from '../ui';

import Pagination from '../Pagination';
import currency from 'currency.js';

import {
    useCreateCustomer,
    useUpdateCustomer,
    useDeleteCustomer,
    useRepayDebt
} from '../../hooks/useCustomerMutations';
import { useCustomers, useCustomerStats } from '../../hooks/useCustomers';
import RepaymentModal from '../customers/RepaymentModal';

import {
    Users, UserPlus, FileText, ShoppingBag,
    Phone, MapPin, Mail, ArrowUpDown, ChevronUp, ChevronDown,
    DollarSign, AlertCircle, CheckCircle2, User, Calendar
} from 'lucide-react';

const EditIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const DeleteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const SortIcon = ({ columnKey, sortConfig }) => {
    const isActive = sortConfig.key === columnKey;
    if (!isActive) {
        return <ArrowUpDown className="w-2.5 h-2.5 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-1" />;
    }
    return sortConfig.direction === 'asc' ? (
        <ChevronUp className="w-3 h-3 text-[#8DB600] shrink-0 ml-1 stroke-[2.5]" />
    ) : (
        <ChevronDown className="w-3 h-3 text-[#8DB600] shrink-0 ml-1 stroke-[2.5]" />
    );
};

const capitalizeWords = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatRelativeTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return '—';
    }
};

const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    } catch {
        return '—';
    }
};

const formatTime = (dateStr) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        return d.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    } catch {
        return '';
    }
};

export default function CustomerManagementPage() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [balanceFilter, setBalanceFilter] = useState('all');
    const [sortConfig, setSortConfig] = useState({ key: 'lastSeen', direction: 'desc' });
    const itemsPerPage = 10;

    const { user, addToast, setCurrentCustomer } = useStore();
    const isDemo = user?.isDemo;

    const { data: customersData = { customers: [], totalPages: 1 }, isLoading } = useCustomers({
        page: currentPage,
        itemsPerPage,
        searchTerm: debouncedSearchTerm,
        balanceFilter,
        sortBy: sortConfig.key,
        sortDirection: sortConfig.direction
    });

    const { data: stats = { totalCustomers: 0, totalDebt: 0, customersWithDebt: 0, cleanAccounts: 0 } } = useCustomerStats();

    const customers = customersData.customers;
    const totalPages = customersData.totalPages;

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

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentPage(1);
    }, [balanceFilter]);

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

    const requestSort = (key) => {
        setSortConfig((prev) => {
            const isSameKey = prev.key === key;
            const newDirection = isSameKey && prev.direction === 'asc' ? 'desc' : 'asc';
            return { key, direction: newDirection };
        });
        setCurrentPage(1);
    };

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
        setAddress(c?.address === 'N/A' ? '' : c?.address || '');
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
            addToast({ title: 'Name Required', description: 'Please enter customer name.', variant: 'destructive' });
            return;
        }

        const capitalizedName = capitalizeWords(name.trim());
        const payload = {
            name: capitalizedName,
            email: email.trim() || null,
            phone: phone.trim() || null,
            address: address.trim() || null,
        };

        try {
            if (editing) {
                await updateCustomer.mutateAsync({ ...payload, id: editing.id, dateAdded: editing.dateAdded });
                addToast({ title: 'Customer Updated', description: `${capitalizedName} was updated.`, variant: 'success' });
            } else {
                await createCustomer.mutateAsync(payload);
                addToast({ title: 'Customer Created', description: `${capitalizedName} added successfully.`, variant: 'success' });
            }
            closeModal();
        } catch (err) {
            addToast({ title: 'Save Failed', description: err.message, variant: 'destructive' });
        }
    };

    const remove = async (c) => {
        if (!confirm(`Are you sure you want to delete ${c.name}? This action cannot be undone.`)) return;
        try {
            await deleteCustomer.mutateAsync(c.id);
            addToast({ title: 'Deleted', description: `${c.name} removed.`, variant: 'success' });
        } catch (err) {
            addToast({ title: 'Delete Failed', description: err.message, variant: 'destructive' });
        }
    };

    const handleRingInPOS = (c) => {
        setCurrentCustomer(c);
        router.push('/pos');
    };

    const handleRepayment = async (id, amount, debtId = null) => {
        try {
            await repayDebt.mutateAsync({
                customerId: id,
                amount,
                debtId: debtId || repayCustomer?.debt_id || null
            });
            setRepayCustomer(null);
            addToast({
                title: 'Payment Recorded',
                description: `Successfully credited ₱${Number(amount).toFixed(2)} to account.`,
                variant: 'success'
            });
        } catch (e) {
            console.error('Repayment error:', e);
            addToast({
                title: 'Repayment Failed',
                description: e.message || 'Database rejected payment update.',
                variant: 'destructive'
            });
        }
    };

    const isMutating = createCustomer.isPending || updateCustomer.isPending || deleteCustomer.isPending;

    return (
        <div className="customer-page responsive-page max-w-7xl mx-auto space-y-6 p-4 md:p-6 overflow-x-hidden">

            {/* Header & Primary Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900 tracking-tight">Customer Management</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Track customer records, delivery landmarks, transaction history, and credit balances.</p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link href="/report?tab=customers#inactive-customers">
                        <Button
                            variant="outline"
                            className="h-10 px-3.5 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 shadow-2xs"
                        >
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                            <span>Inactive Report</span>
                        </Button>
                    </Link>
                    <Button
                        onClick={openModal}
                        variant="primary"
                        className="h-10 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white font-bold text-xs shadow-sm flex items-center gap-1.5 active:scale-95 transition-all"
                        disabled={isDemo}
                    >
                        <UserPlus className="w-4 h-4 stroke-[2.5]" />
                        <span>Add Customer</span>
                    </Button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Customers</span>
                        <span className="text-xl font-black text-slate-900">{stats.totalCustomers}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Utang</span>
                        <span className={`text-xl font-black ${stats.totalDebt > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                            {currency(stats.totalDebt, { symbol: '₱' }).format()}
                        </span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts with Utang</span>
                        <span className="text-xl font-black text-slate-900">{stats.customersWithDebt}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clean / Zero Balance</span>
                        <span className="text-xl font-black text-[#8DB600]">{stats.cleanAccounts}</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-lime-50 text-[#8DB600] flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs">
                <div className="relative w-full sm:max-w-md">
                    <Input
                        ref={searchInputRef}
                        placeholder="Search customer by name, contact, or address... (/)"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-50 border-slate-200 text-xs sm:text-sm h-10 rounded-xl focus:border-[#8DB600] focus:ring-[#8DB600]"
                    />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">Filter:</span>
                    <button
                        type="button"
                        onClick={() => setBalanceFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            balanceFilter === 'all'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        All ({stats.totalCustomers})
                    </button>
                    <button
                        type="button"
                        onClick={() => setBalanceFilter('debt')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${
                            balanceFilter === 'debt'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        <span>With Utang</span>
                        {stats.customersWithDebt > 0 && (
                            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setBalanceFilter('zero')}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            balanceFilter === 'zero'
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Zero Balance
                    </button>
                </div>
            </div>

            {/* Desktop Table View - No Horizontal Scrollbar */}
            <Card className="hidden md:block border border-slate-200 shadow-sm bg-white rounded-2xl overflow-hidden">
                <CardContent className="p-0 overflow-x-hidden">
                    <div className="w-full overflow-x-hidden">
                        <table className="w-full table-fixed text-xs divide-y divide-slate-100">
                            <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200/80">
                                <th className="w-[17%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('name')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Customer Name</span>
                                        <SortIcon columnKey="name" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[10%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('phone')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Contact</span>
                                        <SortIcon columnKey="phone" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[13%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('address')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Delivery Address</span>
                                        <SortIcon columnKey="address" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[9%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('dateAdded')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Date Added</span>
                                        <SortIcon columnKey="dateAdded" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[8%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('lastSeen')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Last Refill</span>
                                        <SortIcon columnKey="lastSeen" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[9%] py-2.5 px-2 text-center">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('credit_balance')}
                                        className="w-full flex items-center justify-center text-center font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Utang</span>
                                        <SortIcon columnKey="credit_balance" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[11%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('utangDate')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Utang Date</span>
                                        <SortIcon columnKey="utangDate" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[11%] py-2.5 px-2 text-left">
                                    <button
                                        type="button"
                                        onClick={() => requestSort('approvedBy')}
                                        className="w-full flex items-center justify-between text-left font-bold text-slate-600 hover:text-slate-900 transition-colors group cursor-pointer select-none outline-none"
                                    >
                                        <span className="truncate">Approved By</span>
                                        <SortIcon columnKey="approvedBy" sortConfig={sortConfig} />
                                    </button>
                                </th>

                                <th className="w-[12%] py-2.5 px-2 text-right font-bold text-slate-600">
                                    Actions
                                </th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                            {isLoading ? (
                                <tr><td colSpan={9} className="text-center py-8 text-slate-400">Loading customers...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-8 text-slate-400">No customers found.</td></tr>
                            ) : (
                                customers.map(c => {
                                    const debt = Number(c.credit_balance || 0);
                                    const hasDebt = debt > 0;
                                    const utangDate = c.utangApprovedAt || c.utang_approved_at;
                                    const utangStaff = c.utangApprovedBy || c.utang_approved_by;

                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="py-2.5 px-2 truncate">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200/80 flex items-center justify-center font-black text-[10px] text-slate-600 shrink-0">
                                                        {c.name?.charAt(0)?.toUpperCase() || 'C'}
                                                    </div>
                                                    <div className="flex flex-col min-w-0 truncate">
                                                        <span className="font-bold text-slate-900 truncate" title={c.name}>{c.name}</span>
                                                        {c.users?.name && (
                                                            <span className="text-[10px] text-slate-400 flex items-center gap-1 truncate">
                                                                    <span
                                                                        className="w-1.5 h-1.5 rounded-full inline-block shrink-0"
                                                                        style={{ backgroundColor: c.users?.color || '#94a3b8' }}
                                                                    />
                                                                    <span className="truncate">By {c.users.name}</span>
                                                                </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-2.5 px-2 text-slate-600 font-medium truncate" title={c.phone}>
                                                {c.phone && c.phone !== 'N/A' ? (
                                                    <span className="font-mono text-xs text-slate-700 truncate">{c.phone}</span>
                                                ) : (
                                                    <span className="text-slate-300 font-normal">—</span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-2 text-slate-600 text-xs truncate" title={c.address}>
                                                {c.address && c.address !== 'N/A' ? (
                                                    <span className="truncate">{c.address}</span>
                                                ) : (
                                                    <span className="text-slate-300 font-normal">—</span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-2 text-[11px] text-slate-500 whitespace-nowrap">
                                                {c.dateAdded ? new Date(c.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                                            </td>

                                            <td className="py-2.5 px-2 text-xs whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold ${
                                                        c.lastSeen ? 'bg-slate-100 text-slate-700' : 'text-slate-400'
                                                    }`}>
                                                        {formatRelativeTime(c.lastSeen)}
                                                    </span>
                                            </td>

                                            <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                                {hasDebt ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                                                            {currency(debt, { symbol: '₱' }).format()}
                                                        </span>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">
                                                            ₱0.00
                                                        </span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-2 text-[11px] whitespace-nowrap">
                                                {hasDebt && utangDate ? (
                                                    <div className="flex flex-col leading-tight">
                                                        <span className="font-semibold text-slate-800">{formatDateTime(utangDate)}</span>
                                                        <span className="text-[10px] text-slate-400 font-mono">{formatTime(utangDate)}</span>
                                                    </div>
                                                ) : hasDebt ? (
                                                    <span className="text-slate-400 italic text-[11px]">Recent</span>
                                                ) : (
                                                    <span className="text-slate-300 font-normal">—</span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-2 text-xs truncate">
                                                {hasDebt && utangStaff ? (
                                                    <div className="inline-flex items-center gap-1 font-bold text-slate-700 truncate" title={utangStaff}>
                                                        <User className="w-3 h-3 text-slate-400 shrink-0" />
                                                        <span className="truncate">{utangStaff}</span>
                                                    </div>
                                                ) : hasDebt ? (
                                                    <span className="text-slate-400 italic text-[11px]">Staff</span>
                                                ) : (
                                                    <span className="text-slate-300 font-normal">—</span>
                                                )}
                                            </td>

                                            <td className="py-2.5 px-2 text-right">
                                                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                                                    {hasDebt && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRepayCustomer({
                                                                id: c.id,
                                                                name: c.name,
                                                                phone: c.phone || '',
                                                                address: c.address || '',
                                                                credit_balance: debt,
                                                                remaining_balance: debt,
                                                                debt_id: null
                                                            })}
                                                            className="px-2 py-0.5 text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-md transition-colors"
                                                            title="Record Debt Repayment"
                                                            disabled={isDemo}
                                                        >
                                                            Pay
                                                        </button>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRingInPOS(c)}
                                                        className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-[#5f7d00] hover:bg-lime-50 border border-slate-200 rounded-md transition-colors"
                                                        title="Ring up in POS"
                                                    >
                                                        <ShoppingBag className="w-3 h-3" />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => startEdit(c)}
                                                        className="w-6 h-6 flex items-center justify-center text-blue-600 hover:bg-blue-50 border border-slate-200 rounded-md transition-colors"
                                                        title="Edit Details"
                                                        disabled={isDemo}
                                                    >
                                                        <EditIcon />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => remove(c)}
                                                        className="w-6 h-6 flex items-center justify-center text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-md transition-colors"
                                                        title="Delete"
                                                        disabled={isDemo}
                                                    >
                                                        <DeleteIcon />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-3 border-t border-slate-100 flex justify-end">
                        <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={setCurrentPage} />
                    </div>
                </CardContent>
            </Card>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
                {isLoading ? (
                    <div className="text-center text-slate-400 p-8">Loading customers...</div>
                ) : customers.length === 0 ? (
                    <div className="text-center text-slate-400 p-8 bg-white rounded-2xl border border-slate-200">
                        No customers found.
                    </div>
                ) : (
                    customers.map(c => {
                        const debt = Number(c.credit_balance || 0);
                        const hasDebt = debt > 0;
                        const utangDate = c.utangApprovedAt || c.utang_approved_at;
                        const utangStaff = c.utangApprovedBy || c.utang_approved_by;

                        return (
                            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-600 shrink-0">
                                            {c.name?.charAt(0)?.toUpperCase() || 'C'}
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-sm text-slate-900 truncate">{c.name}</h4>
                                            <div className="text-xs text-slate-500 font-mono mt-0.5">{c.phone || 'No contact'}</div>
                                        </div>
                                    </div>

                                    {hasDebt ? (
                                        <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                            {currency(debt, { symbol: '₱' }).format()}
                                        </span>
                                    ) : (
                                        <span className="text-xs font-semibold text-slate-400">
                                            ₱0.00
                                        </span>
                                    )}
                                </div>

                                {c.address && c.address !== 'N/A' && (
                                    <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                        <span className="truncate">{c.address}</span>
                                    </div>
                                )}

                                {hasDebt && (
                                    <div className="flex items-center justify-between bg-rose-50/70 border border-rose-100 p-2.5 rounded-xl text-xs">
                                        <div>
                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Utang Date</span>
                                            <span className="font-semibold text-rose-900">
                                                {utangDate ? formatDateTime(utangDate) : 'Recent'}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[9px] font-bold text-rose-500 uppercase tracking-wider block">Approved By</span>
                                            <span className="font-bold text-rose-900">
                                                {utangStaff || 'Staff'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-400">
                                    <span>Last: <strong>{formatRelativeTime(c.lastSeen)}</strong></span>
                                    <div className="flex items-center gap-1.5">
                                        {hasDebt && (
                                            <button
                                                type="button"
                                                onClick={() => setRepayCustomer({
                                                    id: c.id,
                                                    name: c.name,
                                                    phone: c.phone || '',
                                                    address: c.address || '',
                                                    credit_balance: debt,
                                                    remaining_balance: debt,
                                                    debt_id: null
                                                })}
                                                className="px-2.5 py-1 text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 rounded-lg shadow-2xs"
                                                disabled={isDemo}
                                            >
                                                Pay
                                            </button>
                                        )}
                                        <button onClick={() => handleRingInPOS(c)} className="p-1.5 text-slate-600 border border-slate-200 rounded-lg">
                                            <ShoppingBag className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => startEdit(c)} className="p-1.5 text-blue-600 border border-slate-200 rounded-lg" disabled={isDemo}>
                                            <EditIcon />
                                        </button>
                                        <button onClick={() => remove(c)} className="p-1.5 text-rose-600 border border-slate-200 rounded-lg" disabled={isDemo}>
                                            <DeleteIcon />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div className="pt-2">
                    <Pagination currentPage={currentPage} totalPages={totalPages || 1} onPageChange={setCurrentPage} />
                </div>
            </div>

            {/* ADD / EDIT CUSTOMER MODAL */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="p-0 sm:max-w-[500px] w-full bg-white shadow-2xl border-0 overflow-hidden rounded-3xl">
                    <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">
                                {editing ? 'Edit Customer Details' : 'Add New Customer'}
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {editing ? 'Update customer delivery details below.' : 'Register customer for delivery routing and credit accounts.'}
                            </p>
                        </div>
                        <DialogCloseButton onClick={closeModal} className="p-1.5 rounded-full text-slate-400 hover:text-slate-600" />
                    </DialogHeader>

                    <form onSubmit={save}>
                        <div className="p-6 space-y-4">
                            <div>
                                <Label htmlFor="customerName" className="text-xs font-bold text-slate-700">
                                    Full Name <span className="text-rose-500">*</span>
                                </Label>
                                <Input
                                    id="customerName"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    placeholder="e.g. Juan Dela Cruz"
                                    autoFocus
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-sm rounded-xl border-slate-200 focus:border-[#8DB600] focus:ring-[#8DB600]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label htmlFor="customerPhone" className="text-xs font-bold text-slate-700">Phone Number</Label>
                                    <Input
                                        id="customerPhone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="0917 123 4567"
                                        disabled={isDemo}
                                        className="h-10 mt-1 text-xs font-mono rounded-xl border-slate-200"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="customerEmail" className="text-xs font-bold text-slate-700">Email (Optional)</Label>
                                    <Input
                                        id="customerEmail"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="customer@email.com"
                                        disabled={isDemo}
                                        className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="customerAddress" className="text-xs font-bold text-slate-700">Delivery Address / Landmark</Label>
                                <Input
                                    id="customerAddress"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="e.g. Purok 3, Brgy. Laois (Near Solar Dryer)"
                                    disabled={isDemo}
                                    className="h-10 mt-1 text-xs rounded-xl border-slate-200"
                                />
                            </div>
                        </div>

                        <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end gap-2.5">
                            <Button
                                variant="outline"
                                type="button"
                                onClick={closeModal}
                                disabled={isMutating}
                                className="h-10 px-5 rounded-xl text-xs font-bold border-slate-200"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isMutating || isDemo}
                                className="h-10 px-6 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold shadow-md"
                            >
                                {isMutating ? 'Saving...' : (editing ? 'Update Customer' : 'Save Customer')}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Repayment Modal */}
            {repayCustomer && (
                <RepaymentModal
                    isOpen={!!repayCustomer}
                    onClose={() => setRepayCustomer(null)}
                    customer={repayCustomer}
                    onRepay={handleRepayment}
                    isMutating={repayDebt.isPending}
                    isDemo={isDemo}
                />
            )}
        </div>
    );
}