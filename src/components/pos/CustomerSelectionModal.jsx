// src/components/pos/CustomerSelectionModal.jsx
import React from 'react';
import currency from 'currency.js';
import {
    Button,
    Dialog,
    DialogContent,
    DialogCloseButton,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    Input,
    Label,
    ScrollArea
} from '../ui';
import {
    Users,
    Search,
    X,
    UserCheck,
    UserPlus,
    Phone,
    MapPin,
    Check
} from 'lucide-react';

const formatPeso = (val) =>
    currency(Number(val) || 0, { symbol: '₱', precision: 2 }).format();

const CustomerSelectionModal = ({
                                    isOpen,
                                    setIsOpen,
                                    searchTerm,
                                    setSearchTerm,
                                    selectedCustomer,
                                    handleSelectCustomerFromModal,
                                    isSearchingCustomers,
                                    customerSearchResults = [],
                                    debouncedSearchTerm,
                                    handleAddCustomer,
                                    createCustomerMutation,
                                    isDemo
                                }) => {
    const isWalkInSelected = selectedCustomer === null || selectedCustomer === undefined;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="p-0 overflow-hidden max-h-[calc(100dvh-2rem)] w-[95vw] sm:w-full sm:max-w-lg bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl dark:[color-scheme:dark]"
                style={{ zIndex: 50 }}
            >
                <div className="flex flex-col h-full max-h-[calc(100dvh-2rem)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {/* Header */}
                    <DialogHeader className="px-5 py-4 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between flex-shrink-0 z-10">
                        <DialogTitle className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-lime-100 dark:bg-lime-950/60 border border-lime-200/80 dark:border-lime-800/60 text-[#5f7d00] dark:text-lime-400 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4" />
                            </div>
                            <span>Select or Add Customer</span>
                        </DialogTitle>
                        <DialogCloseButton
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        />
                    </DialogHeader>

                    {/* Body */}
                    <div
                        className="flex-1 overflow-y-auto p-5 space-y-4 modal-scroll modal-scrollbar bg-white dark:bg-slate-900"
                        style={{ minHeight: '0' }}
                    >
                        {/* Search Input */}
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="customer-search-modal"
                                className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                            >
                                Search Customer
                            </Label>
                            <div className="relative flex items-center">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                                <Input
                                    id="customer-search-modal"
                                    type="text"
                                    placeholder="Search by name, phone, or address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{
                                        paddingLeft: '2.5rem',
                                        paddingRight: searchTerm ? '2.25rem' : '0.875rem'
                                    }}
                                    className="w-full h-10 !pl-10 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:bg-white dark:focus:bg-slate-900 focus:border-[#8DB600] dark:focus:border-lime-500"
                                    autoFocus
                                />
                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchTerm('')}
                                        aria-label="Clear customer search"
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Customer List */}
                        <ScrollArea className="h-[290px] rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60">
                            <div className="p-2 space-y-1.5">
                                {/* Default Walk-In Option */}
                                <button
                                    type="button"
                                    onClick={() => handleSelectCustomerFromModal(null)}
                                    className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                        isWalkInSelected
                                            ? 'bg-lime-50 dark:bg-lime-950/50 border-[#8DB600]/60 dark:border-lime-700/70 text-slate-900 dark:text-white shadow-2xs'
                                            : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                            isWalkInSelected
                                                ? 'bg-[#8DB600] text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                        }`}>
                                            <UserCheck className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-xs sm:text-sm font-bold truncate">
                                                Walk-in Customer
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                Standard cash / quick counter sale
                                            </div>
                                        </div>
                                    </div>
                                    {isWalkInSelected && (
                                        <Check className="w-4 h-4 text-[#659000] dark:text-lime-400 shrink-0 stroke-[2.5]" />
                                    )}
                                </button>

                                <div className="border-t border-slate-200/80 dark:border-slate-800 my-1" />

                                {isSearchingCustomers ? (
                                    <div className="py-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Searching customers...
                                    </div>
                                ) : (
                                    <>
                                        {customerSearchResults.map((customer) => {
                                            const isSelected = selectedCustomer?.id === customer.id;
                                            const balance = Number(customer.credit_balance || 0);

                                            return (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    onClick={() => handleSelectCustomerFromModal(customer)}
                                                    className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                                                        isSelected
                                                            ? 'bg-lime-50 dark:bg-lime-950/50 border-[#8DB600]/60 dark:border-lime-700/70 text-slate-900 dark:text-white shadow-2xs'
                                                            : 'bg-white dark:bg-slate-900 border-slate-200/70 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                                                    }`}
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="text-xs sm:text-sm font-bold truncate">
                                                                {customer.name}
                                                            </span>
                                                            {balance > 0 && (
                                                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0">
                                                                    Utang: {formatPeso(balance)}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {(customer.phone || customer.address) && (
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                                                                {customer.phone && (
                                                                    <span className="inline-flex items-center gap-1">
                                                                        <Phone className="w-3 h-3 shrink-0" />
                                                                        <span>{customer.phone}</span>
                                                                    </span>
                                                                )}
                                                                {customer.address && (
                                                                    <span className="inline-flex items-center gap-1 truncate max-w-[200px]">
                                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate">{customer.address}</span>
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {isSelected && (
                                                        <Check className="w-4 h-4 text-[#659000] dark:text-lime-400 shrink-0 stroke-[2.5]" />
                                                    )}
                                                </button>
                                            );
                                        })}

                                        {customerSearchResults.length === 0 && debouncedSearchTerm && (
                                            <div className="py-8 px-4 text-center space-y-3">
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    No existing customer matched <span className="font-bold text-slate-800 dark:text-slate-200">&ldquo;{debouncedSearchTerm}&rdquo;</span>.
                                                </p>
                                                <Button
                                                    type="button"
                                                    onClick={() => handleAddCustomer(debouncedSearchTerm)}
                                                    disabled={createCustomerMutation?.isPending || isDemo}
                                                    className="h-9 px-4 rounded-xl bg-[#8DB600] hover:bg-[#7ca000] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                >
                                                    <UserPlus className="w-3.5 h-3.5" />
                                                    <span>
                                                        {createCustomerMutation?.isPending
                                                            ? 'Adding...'
                                                            : `Add "${debouncedSearchTerm}"`}
                                                    </span>
                                                </Button>
                                            </div>
                                        )}

                                        {customerSearchResults.length === 0 && !debouncedSearchTerm && !isSearchingCustomers && (
                                            <div className="py-10 px-4 text-center text-xs text-slate-500 dark:text-slate-400">
                                                Type a customer name above to search existing accounts or create a new customer.
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Footer */}
                    <DialogFooter className="px-5 py-3.5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                        <div className="flex w-full justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                className="h-10 px-6 rounded-xl text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            >
                                Close
                            </Button>
                        </div>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default CustomerSelectionModal;