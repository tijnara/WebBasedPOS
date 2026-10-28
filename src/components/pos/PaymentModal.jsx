// src/components/pos/PaymentModal.jsx
import React, { useMemo, useEffect, useRef } from 'react';
import {
    Button, Dialog, DialogContent, DialogCloseButton, Label, Select
} from '../ui';
import { UserIcon } from '../Icons';
import currency from 'currency.js';

const PaymentModal = ({
                          isOpen,
                          setIsOpen,
                          searchTerm,
                          setSearchTerm,
                          selectedCustomer,
                          handleSelectCustomerInPayment,
                          isSearchingCustomers,
                          customerSearchResults,
                          handleAddCustomer,
                          createCustomerMutation = { isPending: false },
                          lastCustomer,
                          paymentMethod,
                          setPaymentMethod,
                          amountReceived,
                          setAmountReceived,
                          subtotal,
                          saleDate,
                          setSaleDate,
                          saleTime,
                          setSaleTime,
                          handleFinalizeSale,
                          createSaleMutation = { isPending: false },
                          customerPaymentInputRef,
                          isDemo
                      }) => {
    const inputRef = useRef(null);

    const changeDue = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return Math.max(0, received - total);
    }, [amountReceived, subtotal]);

    const isSufficientCash = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return received >= total;
    }, [amountReceived, subtotal]);

    const shortageAmount = useMemo(() => {
        const received = parseFloat(amountReceived) || 0;
        const total = parseFloat(subtotal) || 0;
        return Math.max(0, total - received);
    }, [amountReceived, subtotal]);

    const results = Array.isArray(customerSearchResults) ? customerSearchResults : [];
    const showResults = Boolean(searchTerm && searchTerm.trim().length > 0);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && isOpen) {
                const isValid = !createSaleMutation.isPending &&
                    !(paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < parseFloat(subtotal)) &&
                    !(paymentMethod === 'Cash' && !amountReceived) &&
                    !(paymentMethod === 'Charge' && !selectedCustomer);

                if (isValid) {
                    e.preventDefault();
                    handleFinalizeSale();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, createSaleMutation.isPending, paymentMethod, amountReceived, subtotal, selectedCustomer, handleFinalizeSale]);

    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                if (customerPaymentInputRef?.current) {
                    customerPaymentInputRef.current.focus();
                    customerPaymentInputRef.current.select();
                } else if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, customerPaymentInputRef]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                className="pos-payment-dialog p-0 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
                style={{
                    zIndex: 100,
                    width: '95vw',
                    maxWidth: '720px',
                    height: '85vh',
                    maxHeight: '620px'
                }}
                closeOnBackdropClick={false}
            >
                {/* 1. Header (Always Pinned at Top) */}
                <div className="px-4 sm:px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/90 dark:bg-slate-850 shrink-0">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">Complete Sale</h2>
                        <span className="text-xs font-black font-mono text-[#5f7d00] dark:text-lime-400 bg-lime-100 dark:bg-lime-950/50 px-2.5 py-0.5 rounded-full">
                            {currency(subtotal, { symbol: '₱' }).format()}
                        </span>
                    </div>
                    <DialogCloseButton onClick={() => setIsOpen(false)} />
                </div>

                {/* 2. Scrollable Body (Always Visible and Structured) */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 overflow-y-auto flex-1 min-h-0 space-y-4">

                    {/* Top Total Due Banner */}
                    <div className="bg-gradient-to-r from-emerald-600 to-lime-600 dark:from-emerald-700 dark:to-lime-700 p-3.5 sm:p-4 rounded-2xl text-white shadow-sm flex items-center justify-between shrink-0">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                                Total Amount Due
                            </span>
                            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight leading-tight">
                                {currency(subtotal, { symbol: '₱' }).format()}
                            </span>
                        </div>
                        <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 block">
                                Method
                            </span>
                            <span className="text-xs sm:text-sm font-extrabold bg-white/20 px-2.5 py-1 rounded-lg inline-block">
                                {paymentMethod}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        {/* Column 1: Customer Account & Timestamps */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Label htmlFor="customer-search-payment" className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                    Customer Account
                                </Label>
                                <div className="relative flex items-center">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </div>
                                    <input
                                        id="customer-search-payment"
                                        type="text"
                                        placeholder="Search customer name or phone..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        style={{ paddingLeft: '2.5rem', paddingRight: '2rem' }}
                                        className="w-full h-10 text-xs py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 rounded-xl outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 transition-all font-medium"
                                        ref={customerPaymentInputRef}
                                        autoComplete="off"
                                        disabled={isDemo}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSearchTerm('')}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold z-10"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>

                                {showResults && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 max-h-48 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700">
                                        <button
                                            type="button"
                                            className="w-full text-left py-2 px-3 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-slate-700 dark:text-slate-200 transition-colors"
                                            onClick={() => {
                                                handleSelectCustomerInPayment(null);
                                                setSearchTerm('');
                                            }}
                                            disabled={isDemo}
                                        >
                                            <span className="bg-slate-100 dark:bg-slate-700 p-1 rounded text-slate-500 dark:text-slate-300">
                                                <UserIcon className="w-3.5 h-3.5" />
                                            </span>
                                            Use Walk-in Customer
                                        </button>

                                        {isSearchingCustomers ? (
                                            <div className="p-3 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                                                <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-emerald-600 rounded-full animate-spin" />
                                                Searching...
                                            </div>
                                        ) : results.length > 0 ? (
                                            results.map(customer => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    className="w-full text-left py-2 px-3 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors flex justify-between items-center group"
                                                    onClick={() => {
                                                        handleSelectCustomerInPayment(customer);
                                                        setSearchTerm('');
                                                    }}
                                                    disabled={isDemo}
                                                >
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 truncate">
                                                            {customer.name}
                                                        </span>
                                                        {customer.phone && (
                                                            <span className="text-[10px] text-slate-400 font-mono">
                                                                {customer.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Select
                                                    </span>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="p-3 text-center">
                                                <p className="text-xs text-slate-400 mb-1.5">No customer found.</p>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    className="w-full h-7 text-[11px] font-bold"
                                                    onClick={() => handleAddCustomer(searchTerm)}
                                                    disabled={createCustomerMutation.isPending || isDemo}
                                                >
                                                    {createCustomerMutation.isPending ? 'Adding...' : `+ Add "${searchTerm}"`}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Active Customer Card */}
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                                            Assigned Customer
                                        </span>
                                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">
                                            {selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}
                                        </span>
                                        {selectedCustomer?.phone && (
                                            <span className="text-[10px] text-slate-400 block truncate font-mono">
                                                {selectedCustomer.phone}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {selectedCustomer && (
                                    <button
                                        type="button"
                                        onClick={() => handleSelectCustomerInPayment(null)}
                                        className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                    >
                                        Reset
                                    </button>
                                )}
                            </div>

                            {/* Date / Time Row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                        Date
                                    </Label>
                                    <input
                                        type="date"
                                        value={saleDate}
                                        onChange={e => setSaleDate(e.target.value)}
                                        className="w-full h-9 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-semibold"
                                        disabled={isDemo}
                                    />
                                </div>
                                <div>
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 block">
                                        Time
                                    </Label>
                                    <input
                                        type="time"
                                        value={saleTime}
                                        onChange={e => setSaleTime(e.target.value)}
                                        className="w-full h-9 px-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-700 dark:text-slate-200 font-semibold"
                                        disabled={isDemo}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Payment Method, Cash Input, Denominations, & Change Due */}
                        <div className="space-y-3">
                            <div>
                                <Label htmlFor="paymentMethod" className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                    Payment Method
                                </Label>
                                <Select
                                    id="paymentMethod"
                                    value={paymentMethod}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="w-full h-10 py-1 text-xs font-bold bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                                    disabled={isDemo}
                                >
                                    <option value="Cash">Cash</option>
                                    <option value="Card">Card</option>
                                    <option value="GCash">GCash</option>
                                    <option value="Charge">Charge to Account (Utang)</option>
                                    <option value="Other">Other</option>
                                </Select>
                            </div>

                            {paymentMethod === 'Cash' ? (
                                <div className="space-y-2.5">
                                    <div>
                                        <Label htmlFor="amountReceived" className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                                            Cash Received
                                        </Label>
                                        <div className="relative flex items-center">
                                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base pointer-events-none select-none z-10">
                                                ₱
                                            </span>
                                            <input
                                                id="amountReceived"
                                                type="number"
                                                step="0.01"
                                                inputMode="decimal"
                                                value={amountReceived}
                                                onChange={e => setAmountReceived(e.target.value)}
                                                style={{ paddingLeft: '2.4rem' }}
                                                className="w-full h-11 pr-3 text-lg font-black font-mono text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 rounded-xl outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0.00"
                                                ref={inputRef}
                                                disabled={isDemo}
                                            />
                                        </div>
                                    </div>

                                    {/* Denomination Chips */}
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setAmountReceived(subtotal.toFixed(2))}
                                            className="text-xs h-8.5 font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 active:scale-95"
                                            disabled={isDemo}
                                        >
                                            Exact
                                        </Button>
                                        {[50, 100, 200, 500, 1000].map(amt => (
                                            <Button
                                                key={amt}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setAmountReceived(amt.toString())}
                                                className="text-xs h-8.5 font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-mono active:scale-95"
                                                disabled={isDemo}
                                            >
                                                ₱{amt}
                                            </Button>
                                        ))}
                                    </div>

                                    {/* Change Due / Shortage Banner */}
                                    <div className={`flex justify-between items-center py-2.5 px-3.5 sm:px-4 rounded-2xl border transition-all ${
                                        isSufficientCash
                                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
                                            : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300'
                                    }`}>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold tracking-wider">
                                                {isSufficientCash ? 'Change Due' : 'Shortage / Balance'}
                                            </span>
                                            <span className="text-[11px] opacity-80 font-semibold">
                                                {isSufficientCash ? 'Return to customer' : 'Insufficient cash received'}
                                            </span>
                                        </div>
                                        <span className={`text-xl sm:text-2xl font-black font-mono ${
                                            isSufficientCash
                                                ? 'text-emerald-700 dark:text-emerald-400'
                                                : 'text-rose-600 dark:text-rose-400'
                                        }`}>
                                            {isSufficientCash
                                                ? currency(changeDue, { symbol: '₱' }).format()
                                                : `-₱${shortageAmount.toFixed(2)}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            ) : paymentMethod === 'Charge' ? (
                                <div className="space-y-2">
                                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-amber-900 dark:text-amber-200 text-xs">
                                        <span className="font-bold block">Charge to Account (Utang)</span>
                                        <span>Amount will be added to the customer's balance.</span>
                                    </div>
                                    {selectedCustomer ? (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
                                            <div className="flex justify-between text-slate-500 dark:text-slate-400">
                                                <span>Current Balance:</span>
                                                <span className="font-bold font-mono">{currency(selectedCustomer.credit_balance || 0, { symbol: '₱' }).format()}</span>
                                            </div>
                                            <div className="flex justify-between text-emerald-700 dark:text-emerald-400 font-bold">
                                                <span>+ New Charge:</span>
                                                <span className="font-mono">{currency(subtotal, { symbol: '₱' }).format()}</span>
                                            </div>
                                            <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between font-black text-slate-800 dark:text-slate-100">
                                                <span>New Balance:</span>
                                                <span className="font-mono">{currency((selectedCustomer.credit_balance || 0) + subtotal, { symbol: '₱' }).format()}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold text-center">
                                            ⚠ Select a registered customer to charge.
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-center text-xs text-slate-500 dark:text-slate-400">
                                    Payment processed via {paymentMethod}.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 3. Footer (Always Pinned at Bottom) */}
                <div className="px-4 sm:px-5 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 shrink-0">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsOpen(false)}
                        className="px-3.5 sm:px-4 h-10 text-xs font-bold text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleFinalizeSale}
                        disabled={
                            createSaleMutation.isPending ||
                            (paymentMethod === 'Cash' && parseFloat(amountReceived || 0) < parseFloat(subtotal)) ||
                            (paymentMethod === 'Cash' && !amountReceived) ||
                            (paymentMethod === 'Charge' && !selectedCustomer) ||
                            isDemo
                        }
                        variant="primary"
                        className="flex-1 sm:flex-initial px-5 sm:px-6 h-10 text-xs font-black shadow-md bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5"
                    >
                        {createSaleMutation.isPending ? 'Processing...' : 'Confirm Sale (Enter)'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default PaymentModal;